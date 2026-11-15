import XCTest

/// Builds a task with only the fields a test cares about.
func makeTask(
    _ id: String,
    title: String? = nil,
    when: When = .anytime,
    deadline: Day? = nil,
    done: Bool = false,
    completedAt: Double? = nil,
    folder: String? = nil,
    order: Double = 0,
    note: String = "",
    tags: [String] = [],
    checklist: [ChecklistItem] = [],
    repeatRule: RepeatRule? = nil
) -> Todo {
    Todo(
        id: id, task: title ?? id, done: done, createdAt: 0, note: note, files: [], order: order,
        isPublic: false, folderId: folder, when: when, deadline: deadline, repeatRule: repeatRule,
        checklist: checklist, tags: tags, completedAt: completedAt
    )
}

/// `day("2026-11-15")`, crashing the test on a typo.
func day(_ string: String) -> Day { Day(string)! }

func on(_ string: String, evening: Bool = false, at time: String? = nil) -> When {
    .day(day(string), evening: evening, reminder: time.flatMap(TimeOfDay.init))
}
