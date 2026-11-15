import XCTest

/// Answers requests from a closure so the client can be tested without a network.
final class StubProtocol: URLProtocol {
    nonisolated(unsafe) static var handler: ((URLRequest) -> (Int, Data))?
    nonisolated(unsafe) static var requests: [URLRequest] = []

    override class func canInit(with _: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        var request = request
        if request.httpBody == nil, let stream = request.httpBodyStream {
            stream.open()
            var data = Data()
            var buffer = [UInt8](repeating: 0, count: 4096)
            while stream.hasBytesAvailable {
                let n = stream.read(&buffer, maxLength: buffer.count)
                if n <= 0 { break }
                data.append(buffer, count: n)
            }
            stream.close()
            request.httpBody = data
        }
        Self.requests.append(request)
        let (status, data) = Self.handler?(request) ?? (500, Data())
        client?.urlProtocol(self, didReceive: HTTPURLResponse(url: request.url!, statusCode: status, httpVersion: nil, headerFields: nil)!, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: data)
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}
}

final class DeviceAPITests: XCTestCase {
    private var api: DeviceAPI!

    override func setUp() {
        StubProtocol.requests = []
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [StubProtocol.self]
        api = DeviceAPI(baseURL: URL(string: "https://notes.example")!, session: URLSession(configuration: config), token: { "tok" })
    }

    private func body(_ request: URLRequest) -> [String: Any] {
        (try? JSONSerialization.jsonObject(with: request.httpBody ?? Data()) as? [String: Any]) ?? [:]
    }

    func testCompleteSendsTodayAndReturnsTheNextTaskId() async throws {
        StubProtocol.handler = { _ in (200, Data(#"{"nextId":"n1"}"#.utf8)) }
        let nextId = try await api.complete(taskId: "t1", today: Day("2026-11-15")!)
        XCTAssertEqual(nextId, "n1")
        let request = try XCTUnwrap(StubProtocol.requests.first)
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.url?.path, "/api/device/tasks/t1/complete")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer tok")
        XCTAssertEqual(body(request)["today"] as? String, "2026-11-15")
    }

    func testCreateUsesPutWithTheClientIdSoRetriesDontDuplicate() async throws {
        StubProtocol.handler = { _ in (200, Data(#"{"id":"abc"}"#.utf8)) }
        try await api.create(id: "abc", title: "Milk", when: .day(Day("2026-11-16")!, evening: true, reminder: nil), folderId: nil)
        let request = try XCTUnwrap(StubProtocol.requests.first)
        XCTAssertEqual(request.httpMethod, "PUT")
        XCTAssertEqual(request.url?.path, "/api/device/tasks/abc")
        XCTAssertEqual(body(request)["task"] as? String, "Milk")
        XCTAssertEqual(body(request)["when"] as? String, "2026-11-16")
        XCTAssertEqual(body(request)["evening"] as? Bool, true)
    }

    func testSnapshotParsesTasksAndListsLikeTheDatabase() async throws {
        StubProtocol.handler = { _ in
            (200, Data(#"{"todos":{"a":{"task":"A","order":2,"when":"someday"},"b":{"task":"B","order":1}},"folders":{"f":{"name":"Home","order":0}}}"#.utf8))
        }
        let snapshot = try await api.snapshot()
        XCTAssertEqual(snapshot.todos.map(\.task), ["B", "A"], "sorted by order like the app")
        XCTAssertEqual(snapshot.todos.last?.when, .someday)
        XCTAssertEqual(snapshot.folders.map(\.name), ["Home"])
    }

    func testUnauthorizedIsReportedSoTheUserCanSignInAgain() async {
        StubProtocol.handler = { _ in (401, Data()) }
        do {
            _ = try await api.snapshot()
            XCTFail("expected an error")
        } catch {
            XCTAssertEqual(error as? DeviceAPI.Failure, .signedOut)
        }
    }

    func testMissingTokenFailsWithoutCallingTheServer() async {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [StubProtocol.self]
        let signedOut = DeviceAPI(baseURL: URL(string: "https://notes.example")!, session: URLSession(configuration: config), token: { nil })
        do {
            try await signedOut.reopen(taskId: "t")
            XCTFail("expected an error")
        } catch {
            XCTAssertEqual(error as? DeviceAPI.Failure, .signedOut)
            XCTAssertTrue(StubProtocol.requests.isEmpty)
        }
    }
}

final class DeviceTokenTests: XCTestCase {
    func testExpiredTokenIsNotUsed() throws {
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: dir) }

        DeviceToken(value: "old", expiresAt: 1).save(container: dir)
        XCTAssertNil(DeviceToken.load(container: dir))

        let fresh = DeviceToken(value: "new", expiresAt: Date.now.millisecondsSince1970 + 60_000)
        fresh.save(container: dir)
        XCTAssertEqual(DeviceToken.load(container: dir), fresh)
        DeviceToken.clear(container: dir)
        XCTAssertNil(DeviceToken.load(container: dir))
    }
}
