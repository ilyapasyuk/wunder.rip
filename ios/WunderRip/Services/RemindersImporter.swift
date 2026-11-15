import EventKit
import Foundation

/// One-tap move from Apple Reminders: each reminder list becomes a wunder.rip list (reused by name),
/// open reminders and those completed in the last 90 days become tasks. Safe to run again (stable ids).
@MainActor
enum RemindersImporter {
    enum Failure: LocalizedError {
        case accessDenied

        var errorDescription: String? {
            String(localized: "Allow access to Reminders in Settings to import them.")
        }
    }

    /// Returns how many tasks were imported.
    static func run(userId: String, existingFolders: [TodoFolder]) async throws -> Int {
        let store = EKEventStore()
        guard try await store.requestFullAccessToReminders() else { throw Failure.accessDenied }

        let items = ReminderImport.importable(await fetch(from: store))
        var folderIds = Dictionary(existingFolders.map { ($0.name.lowercased(), $0.id) }, uniquingKeysWith: { first, _ in first })
        let now = Date.now.millisecondsSince1970
        var tasks: [Todo] = []
        for (offset, item) in items.enumerated() {
            let key = item.listName.lowercased()
            if folderIds[key] == nil {
                folderIds[key] = DatabaseService.shared.createFolder(item.listName, userId: userId)
            }
            tasks.append(ReminderImport.task(from: item, folderId: folderIds[key] ?? nil, now: now + Double(offset)))
        }
        try await DatabaseService.shared.importTasks(tasks, userId: userId)
        return tasks.count
    }

    private static func fetch(from store: EKEventStore) async -> [ReminderImport.Item] {
        let calendars = store.calendars(for: .reminder)
        let open = store.predicateForIncompleteReminders(withDueDateStarting: nil, ending: nil, calendars: calendars)
        let recent = store.predicateForCompletedReminders(withCompletionDateStarting: .now.addingTimeInterval(-90 * 86400), ending: nil, calendars: calendars)
        return await reminders(store, open) + reminders(store, recent)
    }

    private static func reminders(_ store: EKEventStore, _ predicate: NSPredicate) async -> [ReminderImport.Item] {
        await withCheckedContinuation { continuation in
            store.fetchReminders(matching: predicate) { reminders in
                let items = (reminders ?? []).map {
                    ReminderImport.Item(id: $0.calendarItemIdentifier, title: $0.title ?? "", notes: $0.notes,
                                        listName: $0.calendar.title, due: $0.dueDateComponents,
                                        completed: $0.isCompleted, completionDate: $0.completionDate)
                }
                continuation.resume(returning: items)
            }
        }
    }
}
