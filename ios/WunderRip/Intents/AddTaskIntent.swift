import AppIntents
import WidgetKit

enum WhenOption: String, AppEnum {
    case today, evening, tomorrow, anytime, someday

    static let typeDisplayRepresentation: TypeDisplayRepresentation = "When"
    static let caseDisplayRepresentations: [WhenOption: DisplayRepresentation] = [
        .today: "Today", .evening: "This Evening", .tomorrow: "Tomorrow", .anytime: "Anytime", .someday: "Someday",
    ]

    func when(today: Day) -> When {
        switch self {
        case .today: .day(today, evening: false, reminder: nil)
        case .evening: .day(today, evening: true, reminder: nil)
        case .tomorrow: .day(today.adding(1, .day), evening: false, reminder: nil)
        case .anytime: .anytime
        case .someday: .someday
        }
    }
}

/// "Add a task" for Siri, Shortcuts and Spotlight. Goes through the Device API, so it works without opening the app.
struct AddTaskIntent: AppIntent {
    static let title: LocalizedStringResource = "Add Task"
    static let description = IntentDescription("Adds a task to wunder.rip.")

    @Parameter(title: "Task", requestValueDialog: "What do you need to do?") var title: String
    @Parameter(title: "When", default: .anytime) var whenOption: WhenOption

    static var parameterSummary: some ParameterSummary {
        Summary("Add \(\.$title) for \(\.$whenOption)")
    }

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let title = Todo.cleanTitle(title)
        guard !title.isEmpty else { throw $title.needsValueError() }
        let id = "siri-\(UUID().uuidString)"
        let when = whenOption.when(today: .today())
        do {
            try await DeviceAPI().create(id: id, title: title, when: when, folderId: nil)
        } catch DeviceAPI.Failure.signedOut {
            return .result(dialog: "Open wunder.rip and sign in first.")
        }
        WidgetCenter.shared.reloadAllTimelines()
        return .result(dialog: "Added “\(title)”.")
    }
}

struct WunderRipShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: AddTaskIntent(),
            phrases: [
                "Add a task in \(.applicationName)",
                "Add to \(.applicationName)",
                "New \(.applicationName) task",
            ],
            shortTitle: "Add Task",
            systemImageName: "plus.circle"
        )
    }
}
