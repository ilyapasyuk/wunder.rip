import Foundation

/// Which local notifications should exist for a set of tasks. Pure: the app's Notifier diffs this against
/// what's pending in UNUserNotificationCenter.
enum ReminderPlan {
    struct Reminder: Equatable {
        /// Stable per task and time, so rescheduling replaces the same request.
        var id: String
        var taskId: String
        var title: String
        var fireDate: Date
    }

    /// iOS keeps at most 64 pending local notifications per app; leave room for others.
    static let systemLimit = 60

    static func reminders(for todos: [Todo], now: Date, calendar: Calendar = .current, limit: Int = systemLimit) -> [Reminder] {
        todos.compactMap { todo -> Reminder? in
            guard !todo.done, let day = todo.when.day, let time = todo.when.reminder,
                  let fire = calendar.date(from: DateComponents(year: day.year, month: day.month, day: day.day,
                                                                hour: time.hour, minute: time.minute)),
                  fire > now
            else { return nil }
            return Reminder(id: "reminder-\(todo.id)-\(day.string)-\(time.string)", taskId: todo.id, title: todo.task, fireDate: fire)
        }
        .sorted { $0.fireDate < $1.fireDate }
        .prefix(limit)
        .map { $0 }
    }
}
