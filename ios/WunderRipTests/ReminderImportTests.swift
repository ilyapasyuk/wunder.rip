import XCTest

final class ReminderImportTests: XCTestCase {
    private let calendar: Calendar = {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "Europe/Nicosia")!
        return calendar
    }()

    func testDueDateWithTimeBecomesDayAndReminder() {
        let item = ReminderImport.Item(id: "r1", title: "  Pay rent ", notes: "via bank", listName: "Home",
                                       due: DateComponents(year: 2026, month: 11, day: 20, hour: 9, minute: 5),
                                       completed: false, completionDate: nil)
        let task = ReminderImport.task(from: item, folderId: "f1", now: 1000)
        XCTAssertEqual(task.task, "Pay rent")
        XCTAssertEqual(task.note, "via bank")
        XCTAssertEqual(task.folderId, "f1")
        XCTAssertEqual(task.when, .day(Day("2026-11-20")!, evening: false, reminder: TimeOfDay("09:05")))
        XCTAssertFalse(task.done)
    }

    func testAllDayDueHasNoReminderAndUndatedIsAnytime() {
        let allDay = ReminderImport.Item(id: "r2", title: "A", notes: nil, listName: "L",
                                         due: DateComponents(year: 2026, month: 11, day: 21), completed: false, completionDate: nil)
        XCTAssertEqual(ReminderImport.task(from: allDay, folderId: nil, now: 0).when, .day(Day("2026-11-21")!, evening: false, reminder: nil))

        let undated = ReminderImport.Item(id: "r3", title: "B", notes: nil, listName: "L", due: nil, completed: false, completionDate: nil)
        XCTAssertEqual(ReminderImport.task(from: undated, folderId: nil, now: 0).when, .anytime)
    }

    func testCompletedRemindersGoToTheLogbookWithTheirDate() {
        let done = Date(timeIntervalSince1970: 1_700_000_000)
        let item = ReminderImport.Item(id: "r4", title: "C", notes: nil, listName: "L", due: nil, completed: true, completionDate: done)
        let task = ReminderImport.task(from: item, folderId: nil, now: 0)
        XCTAssertTrue(task.done)
        XCTAssertEqual(task.completedAt, 1_700_000_000_000)
    }

    func testImportIdIsStableSoRunningTwiceDoesNotDuplicate() {
        let item = ReminderImport.Item(id: "x/y:z", title: "D", notes: nil, listName: "L", due: nil, completed: false, completionDate: nil)
        let first = ReminderImport.task(from: item, folderId: nil, now: 1)
        let second = ReminderImport.task(from: item, folderId: nil, now: 2)
        XCTAssertEqual(first.id, second.id)
        XCTAssertFalse(first.id.contains("/"), "valid Realtime Database key")
    }

    func testEmptyTitlesAreSkipped() {
        let items = [
            ReminderImport.Item(id: "1", title: "   ", notes: nil, listName: "L", due: nil, completed: false, completionDate: nil),
            ReminderImport.Item(id: "2", title: "Keep", notes: nil, listName: "L", due: nil, completed: false, completionDate: nil),
        ]
        XCTAssertEqual(ReminderImport.importable(items).map(\.title), ["Keep"])
    }
}
