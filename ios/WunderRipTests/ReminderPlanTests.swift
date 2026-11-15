import XCTest

final class ReminderPlanTests: XCTestCase {
    private var calendar: Calendar = {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "Europe/Nicosia")!
        return calendar
    }()

    private func todo(_ id: String, _ raw: [String: Any]) -> Todo {
        Todo(id: id, dictionary: ["task": "Task \(id)"].merging(raw) { $1 })
    }

    private func date(_ string: String) -> Date {
        let f = DateFormatter()
        f.calendar = calendar
        f.timeZone = calendar.timeZone
        f.dateFormat = "yyyy-MM-dd HH:mm"
        return f.date(from: string)!
    }

    func testSchedulesFutureRemindersOfOpenTasksAtLocalWallTime() {
        let now = date("2026-11-15 10:00")
        let reminders = ReminderPlan.reminders(for: [
            todo("a", ["when": "2026-11-15", "reminder": "18:30"]),
            todo("past", ["when": "2026-11-15", "reminder": "09:00"]),
            todo("done", ["when": "2026-11-16", "reminder": "09:00", "done": true]),
            todo("noTime", ["when": "2026-11-16"]),
            todo("b", ["when": "2026-11-16", "reminder": "08:00"]),
        ], now: now, calendar: calendar)

        XCTAssertEqual(reminders.map(\.taskId), ["a", "b"])
        XCTAssertEqual(reminders.first?.fireDate, date("2026-11-15 18:30"))
        XCTAssertEqual(reminders.first?.title, "Task a")
    }

    func testKeepsOnlyTheSoonestWithinTheSystemLimit() {
        let now = date("2026-11-15 10:00")
        let tasks = (1 ... 80).map { todo("t\($0)", ["when": Day("2026-11-15")!.adding($0, .day).string, "reminder": "09:00"]) }
        let reminders = ReminderPlan.reminders(for: tasks, now: now, calendar: calendar, limit: 60)
        XCTAssertEqual(reminders.count, 60)
        XCTAssertEqual(reminders.first?.taskId, "t1")
        XCTAssertEqual(reminders.last?.taskId, "t60")
    }

    func testIdentifierIsStableSoReschedulingReplacesInsteadOfDuplicating() {
        let now = date("2026-11-15 10:00")
        let task = todo("a", ["when": "2026-11-16", "reminder": "09:00"])
        XCTAssertEqual(ReminderPlan.reminders(for: [task], now: now, calendar: calendar).first?.id,
                       ReminderPlan.reminders(for: [task], now: now, calendar: calendar).first?.id)
    }
}
