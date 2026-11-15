import XCTest

final class DestinationSectionsTests: XCTestCase {
    private let today = day("2026-11-15")

    private func ids(_ sections: [TaskSection]) -> [[String]] { sections.map { $0.todos.map(\.id) } }

    func testTodayHasMainAndEveningSectionsInOrder() {
        let todos = [
            makeTask("evening", when: on("2026-11-15", evening: true), order: 1),
            makeTask("overdue", when: on("2026-11-10"), order: 2),
            makeTask("first", when: on("2026-11-15"), order: 0),
            makeTask("dueToday", deadline: day("2026-11-15"), order: 3),
            makeTask("tomorrow", when: on("2026-11-16")),
            makeTask("doneToday", when: on("2026-11-15"), done: true),
            makeTask("anytime"),
        ]
        let sections = Destination.smart(.today).sections(of: todos, today: today)
        XCTAssertEqual(sections.map(\.kind), [.tasks, .evening])
        XCTAssertEqual(ids(sections), [["first", "overdue", "dueToday"], ["evening"]])
    }

    func testTodayWithoutEveningTasksHasOneSection() {
        let sections = Destination.smart(.today).sections(of: [makeTask("a", when: on("2026-11-15"))], today: today)
        XCTAssertEqual(sections.map(\.kind), [.tasks])
    }

    func testUpcomingIsGroupedByDayAscending() {
        let todos = [
            makeTask("later", when: on("2026-11-20")),
            makeTask("tomorrowB", when: on("2026-11-16"), order: 2),
            makeTask("tomorrowA", when: on("2026-11-16", evening: true), order: 1),
            makeTask("today", when: on("2026-11-15")),
            makeTask("doneLater", when: on("2026-11-20"), done: true),
            // A future plan with a deadline already due shows in Today, not Upcoming.
            makeTask("dueNow", when: on("2026-11-18"), deadline: day("2026-11-15")),
        ]
        let sections = Destination.smart(.upcoming).sections(of: todos, today: today)
        XCTAssertEqual(sections.map(\.kind), [.day(day("2026-11-16")), .day(day("2026-11-20"))])
        XCTAssertEqual(ids(sections), [["tomorrowA", "tomorrowB"], ["later"]])
    }

    func testAnytimeAndSomedayShowOpenTasksOfThatKind() {
        let todos = [
            makeTask("anytime", folder: "f"),
            makeTask("someday", when: .someday),
            makeTask("doneAnytime", done: true),
            makeTask("dated", when: on("2026-11-20")),
        ]
        XCTAssertEqual(ids(Destination.smart(.anytime).sections(of: todos, today: today)), [["anytime"]])
        XCTAssertEqual(ids(Destination.smart(.someday).sections(of: todos, today: today)), [["someday"]])
    }

    func testLogbookIsNewestCompletedFirstAndCapped() {
        let todos = [
            makeTask("old", done: true, completedAt: 1),
            makeTask("open"),
            makeTask("new", done: true, completedAt: 3),
            makeTask("mid", done: true, completedAt: 2),
            makeTask("legacy", done: true, completedAt: nil),
        ]
        let sections = Destination.smart(.logbook).sections(of: todos, today: today, logbookLimit: 3)
        XCTAssertEqual(ids(sections), [["new", "mid", "old"]])
    }

    func testInboxAndListsShowAllTheirTasksOpenFirstThenDone() {
        let todos = [
            makeTask("doneInbox", done: true, order: 0),
            makeTask("inboxB", order: 2),
            makeTask("inboxA", when: on("2026-11-20"), order: 1),
            makeTask("inList", folder: "f"),
            makeTask("doneInList", done: true, folder: "f"),
        ]
        let inbox = Destination.inbox.sections(of: todos, today: today)
        XCTAssertEqual(inbox.map(\.kind), [.tasks, .done])
        XCTAssertEqual(ids(inbox), [["inboxA", "inboxB"], ["doneInbox"]])
        XCTAssertEqual(ids(Destination.list("f").sections(of: todos, today: today)), [["inList"], ["doneInList"]])
    }

    func testNoTasksMeansNoSections() {
        XCTAssertEqual(Destination.inbox.sections(of: [], today: today), [])
    }
}

final class DestinationBadgeTests: XCTestCase {
    private let today = day("2026-11-15")
    private let todos = [
        makeTask("today", when: on("2026-11-15")),
        makeTask("evening", when: on("2026-11-15", evening: true), folder: "f"),
        makeTask("doneToday", when: on("2026-11-15"), done: true),
        makeTask("inbox"),
        makeTask("doneInbox", done: true),
        makeTask("inList", when: .someday, folder: "f"),
    ]

    func testTodayCountsOpenTasksPlannedForToday() {
        XCTAssertEqual(Destination.smart(.today).badgeCount(of: todos, today: today), 2)
    }

    func testInboxAndListsCountOpenTasks() {
        XCTAssertEqual(Destination.inbox.badgeCount(of: todos, today: today), 2)
        XCTAssertEqual(Destination.list("f").badgeCount(of: todos, today: today), 2)
    }

    func testOtherSmartListsHaveNoBadge() {
        for list in [SmartList.upcoming, .anytime, .someday, .logbook] {
            XCTAssertNil(Destination.smart(list).badgeCount(of: todos, today: today), "\(list)")
        }
    }
}

final class DestinationNewTaskTests: XCTestCase {
    private let today = day("2026-11-15")

    func testNewTaskIsPlannedForTheViewItIsCreatedIn() {
        XCTAssertEqual(Destination.smart(.today).newTaskDefaults(today: today).when, on("2026-11-15"))
        XCTAssertEqual(Destination.smart(.upcoming).newTaskDefaults(today: today).when, on("2026-11-16"))
        XCTAssertEqual(Destination.smart(.someday).newTaskDefaults(today: today).when, .someday)
        XCTAssertEqual(Destination.smart(.anytime).newTaskDefaults(today: today).when, .anytime)
        XCTAssertEqual(Destination.list("f").newTaskDefaults(today: today).folderId, "f")
        XCTAssertNil(Destination.inbox.newTaskDefaults(today: today).folderId)
        XCTAssertEqual(Destination.inbox.newTaskDefaults(today: today).when, .anytime)
    }

    func testListDestinationExistsOnlyWhileItsFolderDoes() {
        let folders = [TodoFolder(id: "f", name: "F", createdAt: 0, order: 0)]
        XCTAssertTrue(Destination.list("f").exists(in: folders))
        XCTAssertFalse(Destination.list("gone").exists(in: folders))
        XCTAssertTrue(Destination.smart(.today).exists(in: []))
        XCTAssertTrue(Destination.inbox.exists(in: []))
    }
}
