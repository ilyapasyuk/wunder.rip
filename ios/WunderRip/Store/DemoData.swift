#if DEBUG
import Foundation

/// DEBUG-only sample data for the simulator, where you can't sign in.
///
/// `-demo 1` skips sign-in and fills every list and badge;
/// `-demoDestination today|upcoming|anytime|someday|logbook|inbox|work|sidebar` picks the list;
/// `-demoTask <id>` opens a task (e.g. `review`); `-demoCompose "<text>"` pre-types a new task.
enum DemoData {
    static var isRequested: Bool { UserDefaults.standard.bool(forKey: "demo") }

    @MainActor
    static func start(_ appState: AppState) {
        let defaults = UserDefaults.standard
        let (todos, folders) = make(today: .today(), now: .now, russian: Locale.preferredLanguages.first?.hasPrefix("ru") == true)
        appState.startDemo(todos: todos, folders: folders)
        // Widgets read the App Group snapshot: give them the demo tasks too (screenshots).
        AppConfig.signedInUserId = "demo"
        SnapshotStore.save(Snapshot(userId: "demo", todos: todos, folders: folders, savedAt: .now))
        switch defaults.string(forKey: "demoDestination") {
        case "upcoming": appState.destination = .smart(.upcoming)
        case "anytime": appState.destination = .smart(.anytime)
        case "someday": appState.destination = .smart(.someday)
        case "logbook": appState.destination = .smart(.logbook)
        case "inbox": appState.destination = .inbox
        case "work": appState.destination = .list("work")
        case "sidebar": appState.destination = nil
        default: appState.destination = .smart(.today)
        }
        appState.selectedTaskId = defaults.string(forKey: "demoTask")
    }

    static var composeText: String { UserDefaults.standard.string(forKey: "demoCompose") ?? "" }

    static func make(today: Day, now: Date, russian: Bool) -> ([Todo], [TodoFolder]) {
        DemoTasks.make(today: today, now: now, russian: russian)
    }
}
#endif
