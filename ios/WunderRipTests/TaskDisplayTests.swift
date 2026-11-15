import XCTest

final class RelativeDayTests: XCTestCase {
    private let today = day("2026-11-15") // Sunday

    func testNamesNearDaysAndDatesFurtherOut() {
        XCTAssertEqual(RelativeDay(day("2026-11-15"), today: today), .today)
        XCTAssertEqual(RelativeDay(day("2026-11-16"), today: today), .tomorrow)
        XCTAssertEqual(RelativeDay(day("2026-11-17"), today: today), .weekday(day("2026-11-17")))
        XCTAssertEqual(RelativeDay(day("2026-11-21"), today: today), .weekday(day("2026-11-21")))
        XCTAssertEqual(RelativeDay(day("2026-11-22"), today: today), .date(day("2026-11-22")))
        XCTAssertEqual(RelativeDay(day("2026-11-14"), today: today), .date(day("2026-11-14")))
    }
}

final class WhenBadgeTests: XCTestCase {
    private let today = day("2026-11-15")

    func testTodayStarAndEveningMoonOutsideToday() {
        XCTAssertEqual(makeTask("a", when: on("2026-11-15")).whenBadge(today: today, in: .inbox), .today)
        XCTAssertEqual(makeTask("a", when: on("2026-11-12")).whenBadge(today: today, in: .list("f")), .today)
        XCTAssertEqual(makeTask("a", when: on("2026-11-15", evening: true)).whenBadge(today: today, in: .smart(.anytime)), .evening)
    }

    func testNoBadgeWhereTheViewAlreadySaysIt() {
        XCTAssertNil(makeTask("a", when: on("2026-11-15")).whenBadge(today: today, in: .smart(.today)))
        XCTAssertNil(makeTask("a", when: on("2026-11-20")).whenBadge(today: today, in: .smart(.upcoming)))
        XCTAssertNil(makeTask("a", when: .someday).whenBadge(today: today, in: .smart(.someday)))
        XCTAssertNil(makeTask("a").whenBadge(today: today, in: .inbox))
        XCTAssertNil(makeTask("a", when: on("2026-11-16"), done: true).whenBadge(today: today, in: .inbox))
    }

    func testFutureDaysAndSomedayInLists() {
        XCTAssertEqual(makeTask("a", when: on("2026-11-16")).whenBadge(today: today, in: .inbox), .day(.tomorrow))
        XCTAssertEqual(makeTask("a", when: on("2026-12-01")).whenBadge(today: today, in: .smart(.today)), .day(.date(day("2026-12-01"))))
        XCTAssertEqual(makeTask("a", when: .someday).whenBadge(today: today, in: .list("f")), .someday)
    }

    func testDeadlineBadgeIsOverdueOnlyAfterTheDay() {
        XCTAssertEqual(makeTask("a", deadline: day("2026-11-14")).deadlineBadge(today: today), DeadlineBadge(day: .date(day("2026-11-14")), overdue: true))
        XCTAssertEqual(makeTask("a", deadline: day("2026-11-15")).deadlineBadge(today: today), DeadlineBadge(day: .today, overdue: false))
        XCTAssertNil(makeTask("a").deadlineBadge(today: today))
        XCTAssertNil(makeTask("a", deadline: day("2026-11-14"), done: true).deadlineBadge(today: today))
    }

    func testChecklistProgress() {
        let items = [ChecklistItem(id: "1", title: "a", done: true), ChecklistItem(id: "2", title: "b"), ChecklistItem(id: "3", title: "c", done: true)]
        XCTAssertEqual(makeTask("a", checklist: items).checklistProgress, ChecklistProgress(done: 2, total: 3))
        XCTAssertNil(makeTask("a").checklistProgress)
    }
}

final class QuickWhenTests: XCTestCase {
    private let today = day("2026-11-15")

    func testQuickChoicesKeepTheReminder() {
        let current = on("2026-11-20", at: "09:00")
        XCTAssertEqual(current.applying(.today, today: today), on("2026-11-15", at: "09:00"))
        XCTAssertEqual(current.applying(.evening, today: today), on("2026-11-15", evening: true, at: "09:00"))
        XCTAssertEqual(current.applying(.tomorrow, today: today), on("2026-11-16", at: "09:00"))
        XCTAssertEqual(current.applying(.someday, today: today), .someday)
        XCTAssertEqual(current.applying(.anytime, today: today), .anytime)
        XCTAssertEqual(When.anytime.applying(.tomorrow, today: today), on("2026-11-16"))
    }

    func testReminderAndEveningOnlyChangeADatedPlan() {
        let time = TimeOfDay("18:30")
        XCTAssertEqual(on("2026-11-20").withReminder(time), on("2026-11-20", at: "18:30"))
        XCTAssertEqual(on("2026-11-20", at: "18:30").withReminder(nil), on("2026-11-20"))
        XCTAssertEqual(When.someday.withReminder(time), .someday)
        XCTAssertEqual(on("2026-11-20", at: "08:00").withEvening(true), on("2026-11-20", evening: true, at: "08:00"))
        XCTAssertEqual(When.anytime.withEvening(true), .anytime)
        XCTAssertEqual(When.someday.onDay(day("2026-11-20")), on("2026-11-20"))
        XCTAssertEqual(on("2026-11-18", evening: true, at: "08:00").onDay(day("2026-11-20")), on("2026-11-20", evening: true, at: "08:00"))
    }
}

final class TagTests: XCTestCase {
    func testAddingATagTrimsHashAndSkipsCaseInsensitiveDuplicates() {
        var task = makeTask("a", tags: ["Work"])
        task = task.addingTag("  #home ")
        task = task.addingTag("work")
        task = task.addingTag("#")
        XCTAssertEqual(task.tags, ["Work", "home"])
        XCTAssertEqual(task.removingTag("WORK").tags, ["home"])
    }

    func testSuggestionsComeFromOtherTasksMostUsedFirst() {
        let todos = [
            makeTask("1", tags: ["Home", "work"]),
            makeTask("2", tags: ["Work"]),
            makeTask("3", tags: ["errands", "Wishlist"]),
        ]
        XCTAssertEqual(TagSuggestions.suggestions(for: "", in: todos, excluding: []), ["work", "errands", "Home", "Wishlist"])
        XCTAssertEqual(TagSuggestions.suggestions(for: "w", in: todos, excluding: ["WORK"]), ["Wishlist"])
        XCTAssertEqual(TagSuggestions.suggestions(for: "#ho", in: todos, excluding: []), ["Home"])
    }
}
