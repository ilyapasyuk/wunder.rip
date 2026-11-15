import Foundation

/// Maps Apple Reminders into wunder.rip tasks. Pure: the EventKit reading lives in the app (`RemindersImporter`).
enum ReminderImport {
    /// The parts of an EKReminder we use.
    struct Item: Equatable {
        var id: String
        var title: String
        var notes: String?
        var listName: String
        var due: DateComponents?
        var completed: Bool
        var completionDate: Date?
    }

    static func importable(_ items: [Item]) -> [Item] {
        items.filter { !Todo.cleanTitle($0.title).isEmpty }
    }

    /// Database key derived from the reminder, so importing twice overwrites instead of duplicating.
    static func taskId(for item: Item) -> String {
        "reminders-" + item.id.unicodeScalars.map { CharacterSet.alphanumerics.contains($0) ? String($0) : "_" }.joined()
    }

    static func task(from item: Item, folderId: String?, now: Double) -> Todo {
        var task = Todo(id: taskId(for: item), task: Todo.cleanTitle(item.title), done: item.completed, createdAt: now,
                        note: item.notes ?? "", files: [], order: -now, isPublic: false, folderId: folderId)
        if let due = item.due, let year = due.year, let month = due.month, let dayOfMonth = due.day,
           let day = Day(String(format: "%04d-%02d-%02d", year, month, dayOfMonth)) {
            let time = due.hour.flatMap { hour in TimeOfDay(hour: hour, minute: due.minute ?? 0) }
            task.when = .day(day, evening: false, reminder: time)
        }
        if item.completed {
            task.completedAt = (item.completionDate ?? Date(timeIntervalSince1970: now / 1000)).millisecondsSince1970
        }
        return task
    }
}
