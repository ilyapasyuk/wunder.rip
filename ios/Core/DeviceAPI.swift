import Foundation

/// Client for the worker's Device API (shared/DEVICE_API.md): lets widgets, Siri, the Share Extension
/// and the watch change tasks without a Firebase session.
struct DeviceAPI {
    enum Failure: Error, Equatable {
        case signedOut
        case server(Int)
        case badResponse
    }

    struct Snapshot {
        var todos: [Todo]
        var folders: [TodoFolder]
    }

    static let productionURL = URL(string: "https://notes.pasyuk.com")!

    let baseURL: URL
    let session: URLSession
    /// Current device token, read on every call (it can be refreshed or cleared between calls).
    let token: () -> String?

    init(baseURL: URL = productionURL, session: URLSession = .shared, token: @escaping () -> String? = { DeviceToken.load()?.value }) {
        self.baseURL = baseURL
        self.session = session
        self.token = token
    }

    /// Exchanges a Firebase ID token (app only) for a device token the extensions and the watch can use.
    func createSession(idToken: String) async throws -> DeviceToken {
        let json = try await send("POST", "session", body: ["idToken": idToken], authorized: false)
        guard let value = json["token"] as? String, let expiresAt = (json["expiresAt"] as? NSNumber)?.doubleValue else {
            throw Failure.badResponse
        }
        return DeviceToken(value: value, expiresAt: expiresAt)
    }

    func snapshot() async throws -> Snapshot {
        let json = try await send("GET", "snapshot")
        let todos = (json["todos"] as? [String: [String: Any]] ?? [:])
            .map { Todo(id: $0.key, dictionary: $0.value) }
            .sorted { $0.order < $1.order }
        let folders = (json["folders"] as? [String: [String: Any]] ?? [:])
            .map { TodoFolder(id: $0.key, dictionary: $0.value) }
            .sorted { $0.order < $1.order }
        return Snapshot(todos: todos, folders: folders)
    }

    func create(id: String, title: String, when: When, folderId: String?) async throws {
        var task = Todo(id: id, task: Todo.cleanTitle(title), done: false, createdAt: 0, note: "", files: [], order: 0, isPublic: false, folderId: folderId)
        task.when = when
        var body = task.planDictionary.filter { !($0.value is NSNull) }
        body["task"] = task.task
        if let folderId { body["folderId"] = folderId }
        _ = try await send("PUT", "tasks/\(id)", body: body)
    }

    /// Returns the id of the next task when the completed one repeats.
    func complete(taskId: String, today: Day) async throws -> String? {
        try await send("POST", "tasks/\(taskId)/complete", body: ["today": today.string])["nextId"] as? String
    }

    func reopen(taskId: String) async throws {
        _ = try await send("POST", "tasks/\(taskId)/reopen", body: [:])
    }

    func plan(taskId: String, when: When) async throws {
        var task = Todo(id: taskId, task: "", done: false, createdAt: 0, note: "", files: [], order: 0, isPublic: false, folderId: nil)
        task.when = when
        let fields = task.planDictionary
        _ = try await send("PATCH", "tasks/\(taskId)", body: ["when": fields["when"]!, "evening": fields["evening"]!, "reminder": fields["reminder"]!])
    }

    private func send(_ method: String, _ path: String, body: [String: Any]? = nil, authorized: Bool = true) async throws -> [String: Any] {
        var request = URLRequest(url: baseURL.appendingPathComponent("api/device/\(path)"))
        request.httpMethod = method
        if authorized {
            guard let token = token() else { throw Failure.signedOut }
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw Failure.badResponse }
        if http.statusCode == 401 { throw Failure.signedOut }
        guard (200 ..< 300).contains(http.statusCode) else { throw Failure.server(http.statusCode) }
        if data.isEmpty { return [:] }
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else { throw Failure.badResponse }
        return json
    }
}

/// The device token in the App Group, shared by the app and its extensions.
struct DeviceToken: Codable, Equatable {
    var value: String
    var expiresAt: Double

    static func url(in container: URL? = AppConfig.groupContainer) -> URL? {
        container?.appendingPathComponent("device-token.json")
    }

    static func load(container: URL? = AppConfig.groupContainer) -> DeviceToken? {
        guard let url = url(in: container), let data = try? Data(contentsOf: url),
              let token = try? JSONDecoder().decode(DeviceToken.self, from: data),
              token.expiresAt > Date.now.millisecondsSince1970
        else { return nil }
        return token
    }

    func save(container: URL? = AppConfig.groupContainer) {
        guard let url = Self.url(in: container), let data = try? JSONEncoder().encode(self) else { return }
        try? data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
    }

    static func clear(container: URL? = AppConfig.groupContainer) {
        guard let url = url(in: container) else { return }
        try? FileManager.default.removeItem(at: url)
    }
}
