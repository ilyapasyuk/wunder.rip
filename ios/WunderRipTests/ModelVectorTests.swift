import XCTest

/// Runs `shared/model-vectors.json`, the cases every client (web, MCP, iOS) must agree on.
final class ModelVectorTests: XCTestCase {
    private var vectors: [String: Any] = [:]

    override func setUpWithError() throws {
        let url = try XCTUnwrap(Bundle(for: Self.self).url(forResource: "model-vectors", withExtension: "json"))
        vectors = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any])
    }

    private func cases(_ key: String) -> [[String: Any]] {
        vectors[key] as? [[String: Any]] ?? []
    }

    func testParse() throws {
        XCTAssertFalse(cases("parse").isEmpty)
        for vector in cases("parse") {
            let raw = try XCTUnwrap(vector["raw"] as? [String: Any])
            let expected = try XCTUnwrap(vector["normalized"] as? NSDictionary)
            let todo = Todo(id: "x", dictionary: raw)
            XCTAssertEqual(NSDictionary(dictionary: todo.planDictionary), expected, "\(vector["name"] ?? "")")
        }
    }

    func testClassify() throws {
        XCTAssertFalse(cases("classify").isEmpty)
        for vector in cases("classify") {
            let raw = try XCTUnwrap(vector["raw"] as? [String: Any])
            let today = try XCTUnwrap(Day(vector["today"] as? String ?? ""))
            let placement = Todo(id: "x", dictionary: raw).placement(today: today)
            XCTAssertEqual(placement.list.rawValue, vector["list"] as? String, "\(raw)")
            XCTAssertEqual(placement.evening, vector["evening"] as? Bool, "\(raw)")
        }
    }

    func testNextRepeat() throws {
        XCTAssertFalse(cases("nextRepeat").isEmpty)
        for vector in cases("nextRepeat") {
            let raw = try XCTUnwrap(vector["raw"] as? [String: Any])
            let today = try XCTUnwrap(Day(vector["today"] as? String ?? ""))
            let result = Todo(id: "x", dictionary: raw).complete(today: today, now: 1, nextId: "n")
            guard let expected = vector["next"] as? [String: Any] else {
                XCTAssertNil(result.next, "\(vector["name"] ?? "")")
                continue
            }
            let next = try XCTUnwrap(result.next, "\(vector["name"] ?? "")")
            XCTAssertEqual(next.when.day?.string, expected["when"] as? String, "\(vector["name"] ?? "")")
            XCTAssertEqual(next.deadline?.string, expected["deadline"] as? String, "\(vector["name"] ?? "")")
        }
    }
}

final class CompletionTests: XCTestCase {
    private let today = Day("2026-11-15")!

    private func task(_ raw: [String: Any]) -> Todo {
        Todo(id: "t", dictionary: ["task": "Water plants", "order": 3].merging(raw) { $1 })
    }

    func testCompletingAPlainTaskSetsDoneAndTimeOnly() {
        let result = task([:]).complete(today: today, now: 42, nextId: "n")
        XCTAssertTrue(result.completed.done)
        XCTAssertEqual(result.completed.completedAt, 42)
        XCTAssertNil(result.next)
    }

    func testRepeatMovesToTheNextTaskWithAFreshChecklist() throws {
        let result = task([
            "when": "2026-11-15", "evening": true, "reminder": "08:00", "tags": ["home"],
            "checklist": [["id": "c", "title": "soil", "done": true]],
            "repeat": ["unit": "day", "every": 2, "from": "schedule"],
        ]).complete(today: today, now: 42, nextId: "n")

        XCTAssertNil(result.completed.repeatRule, "the finished task leaves the series")
        let next = try XCTUnwrap(result.next)
        XCTAssertEqual(next.id, "n")
        XCTAssertFalse(next.done)
        XCTAssertNil(next.completedAt)
        XCTAssertEqual(next.task, "Water plants")
        XCTAssertEqual(next.order, 3)
        XCTAssertEqual(next.when, .day(Day("2026-11-17")!, evening: true, reminder: TimeOfDay("08:00")))
        XCTAssertEqual(next.checklist, [ChecklistItem(id: "c", title: "soil", done: false)])
        XCTAssertEqual(next.tags, ["home"])
        XCTAssertEqual(next.repeatRule, RepeatRule(unit: .day, every: 2, from: .schedule))
    }

    func testReopeningClearsCompletionTime() {
        let done = task([:]).complete(today: today, now: 42, nextId: "n").completed
        let reopened = done.reopened()
        XCTAssertFalse(reopened.done)
        XCTAssertNil(reopened.completedAt)
    }

    func testNewFieldsSurviveTheDatabaseRoundTrip() {
        let original = task([
            "when": "2026-11-20", "evening": true, "reminder": "07:15", "deadline": "2026-11-22",
            "repeat": ["unit": "month", "every": 1, "from": "completion"],
            "checklist": [["id": "a", "title": "one", "done": false]], "tags": ["x"], "completedAt": 5,
        ])
        XCTAssertEqual(Todo(id: "t", dictionary: original.dictionary), original)
    }

    func testClearedFieldsAreWrittenAsNullSoTheyAreRemoved() {
        let dict = task([:]).dictionary
        for key in ["when", "reminder", "deadline", "repeat", "completedAt"] {
            XCTAssertTrue(dict[key] is NSNull, key)
        }
    }

    func testSnapshotKeepsNewFields() throws {
        let original = task(["when": "someday", "tags": ["a"], "deadline": "2026-12-01"])
        let decoded = try JSONDecoder().decode(Todo.self, from: JSONEncoder().encode(original))
        XCTAssertEqual(decoded, original)
    }
}
