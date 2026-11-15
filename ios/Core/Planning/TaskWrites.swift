import Foundation

/// Multi-path database updates built from the model, so related writes land together or not at all.
enum TaskWrites {
    /// Completes `todo` under `root` (`todos/{uid}`). For a repeating task the successor (`nextId`) is written in
    /// the same update: there is never a completed task whose series has no next task.
    /// The completed task is written field by field, so fields this client doesn't know are kept.
    static func completion(of todo: Todo, today: Day, now: Double, nextId: String, root: String) -> [String: Any] {
        let (completed, next) = todo.complete(today: today, now: now, nextId: nextId)
        var updates: [String: Any] = [:]
        for (field, value) in completed.dictionary {
            updates["\(root)/\(completed.id)/\(field)"] = value
        }
        if let next {
            updates["\(root)/\(next.id)"] = next.dictionary.filter { !($0.value is NSNull) }
        }
        return updates
    }
}
