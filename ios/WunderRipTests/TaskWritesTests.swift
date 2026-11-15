import XCTest

final class TaskWritesTests: XCTestCase {
    private let today = day("2026-11-15")

    func testCompletingARepeatWritesTheTaskAndItsSuccessorTogether() throws {
        let task = makeTask("a", when: on("2026-11-15"), repeatRule: RepeatRule(unit: .day))
        let updates = TaskWrites.completion(of: task, today: today, now: 42, nextId: "n", root: "todos/u")

        XCTAssertEqual(updates["todos/u/a/done"] as? Bool, true)
        XCTAssertEqual(updates["todos/u/a/completedAt"] as? Double, 42)
        XCTAssertTrue(updates["todos/u/a/repeat"] is NSNull)
        let next = try XCTUnwrap(updates["todos/u/n"] as? [String: Any])
        XCTAssertEqual(Todo(id: "n", dictionary: next).when, on("2026-11-16"))
        XCTAssertEqual(Todo(id: "n", dictionary: next).repeatRule, RepeatRule(unit: .day))
        XCTAssertEqual(next["done"] as? Bool, false)
    }

    func testCompletingAPlainTaskWritesOnlyThatTask() {
        let updates = TaskWrites.completion(of: makeTask("a"), today: today, now: 42, nextId: "n", root: "todos/u")
        XCTAssertEqual(updates["todos/u/a/done"] as? Bool, true)
        XCTAssertNil(updates["todos/u/n"])
        XCTAssertTrue(updates.keys.allSatisfy { $0.hasPrefix("todos/u/a/") })
    }

    func testNewTaskCarriesItsPlan() {
        let dict = Todo.new(title: "x", folderId: nil, when: on("2026-11-16", evening: true), deadline: day("2026-11-20"), tags: ["a"])
        let todo = Todo(id: "x", dictionary: dict)
        XCTAssertEqual(todo.when, on("2026-11-16", evening: true))
        XCTAssertEqual(todo.deadline, day("2026-11-20"))
        XCTAssertEqual(todo.tags, ["a"])
    }
}
