import Foundation
import UserNotifications

/// Keeps local notifications in line with `ReminderPlan` and handles the "Done" / "In 1 hour" buttons.
@MainActor
final class Notifier: NSObject, UNUserNotificationCenterDelegate {
    static let shared = Notifier()

    static let category = "TASK_REMINDER"
    private static let doneAction = "DONE"
    private static let snoozeAction = "SNOOZE_1H"

    /// Set by the app: what to do when a notification button is tapped.
    var onComplete: ((_ taskId: String) -> Void)?
    var onSnooze: ((_ taskId: String, _ until: Date) -> Void)?

    private let center = UNUserNotificationCenter.current()

    func activate() {
        center.delegate = self
        center.setNotificationCategories([
            UNNotificationCategory(identifier: Self.category, actions: [
                UNNotificationAction(identifier: Self.doneAction, title: String(localized: "Done"), options: []),
                UNNotificationAction(identifier: Self.snoozeAction, title: String(localized: "In 1 hour"), options: []),
            ], intentIdentifiers: []),
        ])
    }

    /// Asks once, the first time a task actually has a reminder.
    func requestPermissionIfNeeded() async {
        let settings = await center.notificationSettings()
        if settings.authorizationStatus == .notDetermined {
            _ = try? await center.requestAuthorization(options: [.alert, .sound, .badge])
        }
    }

    func sync(_ todos: [Todo]) async {
        let wanted = ReminderPlan.reminders(for: todos, now: .now)
        if !wanted.isEmpty { await requestPermissionIfNeeded() }

        let pending = await center.pendingNotificationRequests().map(\.identifier).filter { $0.hasPrefix("reminder-") }
        let wantedIds = Set(wanted.map(\.id))
        center.removePendingNotificationRequests(withIdentifiers: pending.filter { !wantedIds.contains($0) })

        for reminder in wanted where !pending.contains(reminder.id) {
            let content = UNMutableNotificationContent()
            content.title = reminder.title
            content.sound = .default
            content.categoryIdentifier = Self.category
            content.interruptionLevel = .timeSensitive
            content.userInfo = ["taskId": reminder.taskId]
            let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: reminder.fireDate)
            let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
            try? await center.add(UNNotificationRequest(identifier: reminder.id, content: content, trigger: trigger))
        }
    }

    func clearAll() {
        center.removeAllPendingNotificationRequests()
    }

    nonisolated func userNotificationCenter(_: UNUserNotificationCenter, willPresent _: UNNotification) async -> UNNotificationPresentationOptions {
        [.banner, .sound]
    }

    nonisolated func userNotificationCenter(_: UNUserNotificationCenter, didReceive response: UNNotificationResponse) async {
        guard let taskId = response.notification.request.content.userInfo["taskId"] as? String else { return }
        let action = response.actionIdentifier
        await MainActor.run {
            switch action {
            case Self.doneAction: onComplete?(taskId)
            case Self.snoozeAction: onSnooze?(taskId, .now.addingTimeInterval(3600))
            default: break
            }
        }
    }
}
