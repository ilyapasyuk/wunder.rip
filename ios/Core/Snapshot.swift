import Foundation

/// Last known tasks and lists, kept in the App Group so the app opens instantly
/// and widgets / the watch app can read them without Firebase.
struct Snapshot: Codable, Equatable {
    var userId: String
    var todos: [Todo]
    var folders: [TodoFolder]
    var savedAt: Date
}

enum SnapshotStore {
    static func url(in container: URL? = AppConfig.groupContainer) -> URL? {
        container?.appendingPathComponent("snapshot.json")
    }

    static func load(userId: String, container: URL? = AppConfig.groupContainer) -> Snapshot? {
        guard
            let url = url(in: container),
            let data = try? Data(contentsOf: url),
            let snapshot = try? JSONDecoder().decode(Snapshot.self, from: data),
            snapshot.userId == userId
        else { return nil }
        return snapshot
    }

    static func save(_ snapshot: Snapshot, container: URL? = AppConfig.groupContainer) {
        guard let url = url(in: container), let data = try? JSONEncoder().encode(snapshot) else { return }
        try? data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
    }

    static func clear(container: URL? = AppConfig.groupContainer) {
        guard let url = url(in: container) else { return }
        try? FileManager.default.removeItem(at: url)
    }
}
