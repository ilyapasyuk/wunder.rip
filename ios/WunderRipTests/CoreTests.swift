import XCTest

final class TodoParsingTests: XCTestCase {
    func testParsesWebPayloadWithIntegerNumbersAndMissingFields() {
        let todo = Todo(id: "a", dictionary: ["task": "Milk", "createdAt": 1_700_000_000_000 as Int, "order": -5 as Int])
        XCTAssertEqual(todo.task, "Milk")
        XCTAssertEqual(todo.createdAt, 1_700_000_000_000)
        XCTAssertEqual(todo.order, -5)
        XCTAssertFalse(todo.done)
        XCTAssertEqual(todo.files, [])
        XCTAssertNil(todo.folderId)
    }

    func testRoundTripsThroughDictionary() {
        let todo = Todo(id: "a", task: "T", done: true, createdAt: 1, note: "n", files: ["f"], order: 2, isPublic: true, folderId: "x")
        XCTAssertEqual(Todo(id: "a", dictionary: todo.dictionary), todo)
    }

    func testInboxIsWrittenAsNull() {
        let dict = Todo.new(title: "x", folderId: nil)
        XCTAssertTrue(dict["folderId"] is NSNull)
    }

    func testNewTaskIsNewestFirstAndTrimmed() {
        let now = Date(timeIntervalSince1970: 100)
        let dict = Todo.new(title: "  hello  ", folderId: "f", now: now)
        XCTAssertEqual(dict["task"] as? String, "hello")
        XCTAssertEqual(dict["createdAt"] as? Double, 100_000)
        XCTAssertEqual(dict["order"] as? Double, -100_000)
        XCTAssertEqual(dict["folderId"] as? String, "f")
    }

    func testTitleIsCappedLikeTheWebApp() {
        XCTAssertEqual(Todo.cleanTitle(String(repeating: "a", count: 300)).count, Todo.maxTitleLength)
        XCTAssertEqual(TodoFolder.cleanName(String(repeating: "b", count: 300)).count, TodoFolder.maxNameLength)
    }
}

final class OutboxTests: XCTestCase {
    private var dir: URL!

    override func setUp() {
        dir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    }

    override func tearDown() {
        try? FileManager.default.removeItem(at: dir)
    }

    func testEnqueueListAndRemove() throws {
        let outbox = Outbox(directory: dir)
        let first = try outbox.enqueue(userId: "u1", title: "one", now: Date(timeIntervalSince1970: 1))
        let second = try outbox.enqueue(userId: "u1", title: "two", imageData: Data([1, 2, 3]), now: Date(timeIntervalSince1970: 2))
        try outbox.enqueue(userId: "other", title: "not mine")

        XCTAssertEqual(outbox.pending(for: "u1").map(\.title), ["one", "two"])
        XCTAssertNil(outbox.imageData(for: first))
        XCTAssertEqual(outbox.imageData(for: second), Data([1, 2, 3]))

        outbox.remove(second)
        XCTAssertEqual(outbox.pending(for: "u1"), [first])
        XCTAssertFalse(FileManager.default.fileExists(atPath: dir.appendingPathComponent(second.imageFile!).path))
    }

    func testEmptyWhenDirectoryMissing() {
        XCTAssertEqual(Outbox(directory: dir).pending(for: "u1"), [])
    }
}

final class SnapshotTests: XCTestCase {
    func testSavesAndLoadsOnlyForSameUser() throws {
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: dir) }

        let todo = Todo(id: "a", task: "T", done: false, createdAt: 1, note: "", files: [], order: 0, isPublic: false, folderId: nil)
        let snapshot = Snapshot(userId: "u1", todos: [todo], folders: [], savedAt: Date(timeIntervalSince1970: 5))
        SnapshotStore.save(snapshot, container: dir)

        XCTAssertEqual(SnapshotStore.load(userId: "u1", container: dir), snapshot)
        XCTAssertNil(SnapshotStore.load(userId: "u2", container: dir))
        SnapshotStore.clear(container: dir)
        XCTAssertNil(SnapshotStore.load(userId: "u1", container: dir))
    }
}
