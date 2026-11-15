import AppIntents
import WidgetKit

/// Checks a task off from a widget. Updates the App Group snapshot right away so the widget redraws,
/// then tells the server (which also creates the next task of a repeating series).
struct CompleteTaskIntent: AppIntent {
    static let title: LocalizedStringResource = "Complete Task"
    static let isDiscoverable = false

    @Parameter(title: "Task ID") var taskId: String

    init() {}
    init(taskId: String) { self.taskId = taskId }

    func perform() async throws -> some IntentResult {
        let today = Day.today()
        guard let userId = AppConfig.signedInUserId, var snapshot = SnapshotStore.load(userId: userId),
              let index = snapshot.todos.firstIndex(where: { $0.id == taskId }) else { return .result() }

        let original = snapshot
        let result = snapshot.todos[index].complete(today: today, now: Date.now.millisecondsSince1970, nextId: "pending-\(taskId)")
        snapshot.todos.replaceSubrange(index ... index, with: [result.completed] + (result.next.map { [$0] } ?? []))
        SnapshotStore.save(snapshot)

        do {
            let nextId = try await DeviceAPI().complete(taskId: taskId, today: today)
            if let nextId, let pending = snapshot.todos.firstIndex(where: { $0.id == "pending-\(taskId)" }) {
                snapshot.todos[pending].id = nextId
                SnapshotStore.save(snapshot)
            }
        } catch {
            SnapshotStore.save(original)
        }
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}
