import FirebaseDatabase
import Foundation

enum DBPaths {
    static let taskRoot = "todos"
    static let folderRoot = "folders"

    static func tasks(for userId: String) -> String { "\(taskRoot)/\(userId)" }
    static func task(_ taskId: String, for userId: String) -> String { "\(taskRoot)/\(userId)/\(taskId)" }
    static func folders(for userId: String) -> String { "\(folderRoot)/\(userId)" }
    static func folder(_ folderId: String, for userId: String) -> String { "\(folderRoot)/\(userId)/\(folderId)" }
}

final class DatabaseService {
    static let shared = DatabaseService()

    /// Must run once, right after `FirebaseApp.configure()` and before any database access:
    /// keeps a disk cache so the app works offline and queues writes until it's back online.
    static func enableOfflinePersistence() {
        let database = Database.database()
        database.isPersistenceEnabled = true
        database.persistenceCacheSizeBytes = 50 * 1024 * 1024
    }

    private let db = Database.database().reference()

    private init() {}

    // MARK: - Observing

    func observeTasks(userId: String, onChange: @escaping ([Todo]) -> Void) -> DatabaseHandle {
        let ref = db.child(DBPaths.tasks(for: userId))
        ref.keepSynced(true)
        return ref.observe(.value) { snapshot in
            var result: [Todo] = []
            for case let child as DataSnapshot in snapshot.children {
                guard let dict = child.value as? [String: Any] else { continue }
                result.append(Todo(id: child.key, dictionary: dict))
            }
            result.sort { $0.order < $1.order }
            onChange(result)
        }
    }

    func stopObservingTasks(userId: String, handle: DatabaseHandle) {
        let ref = db.child(DBPaths.tasks(for: userId))
        ref.removeObserver(withHandle: handle)
        ref.keepSynced(false)
    }

    func observeFolders(userId: String, onChange: @escaping ([TodoFolder]) -> Void) -> DatabaseHandle {
        let ref = db.child(DBPaths.folders(for: userId))
        ref.keepSynced(true)
        return ref.observe(.value) { snapshot in
            var result: [TodoFolder] = []
            for case let child as DataSnapshot in snapshot.children {
                guard let dict = child.value as? [String: Any] else { continue }
                result.append(TodoFolder(id: child.key, dictionary: dict))
            }
            result.sort { $0.order < $1.order }
            onChange(result)
        }
    }

    func stopObservingFolders(userId: String, handle: DatabaseHandle) {
        let ref = db.child(DBPaths.folders(for: userId))
        ref.removeObserver(withHandle: handle)
        ref.keepSynced(false)
    }

    // MARK: - Tasks

    @discardableResult
    func createTask(_ text: String, folderId: String?, files: [String] = [], userId: String) -> String? {
        let ref = db.child(DBPaths.tasks(for: userId)).childByAutoId()
        ref.setValue(Todo.new(title: text, folderId: folderId, files: files))
        return ref.key
    }

    /// Writes a task under a fixed key and waits for the server to confirm it.
    /// Used when draining the outbox: retrying the same item overwrites instead of duplicating.
    func createTaskConfirmed(key: String, _ text: String, folderId: String?, files: [String], userId: String) async throws {
        let ref = db.child(DBPaths.task(key, for: userId))
        try await ref.setValue(Todo.new(title: text, folderId: folderId, files: files))
    }

    func updateTask(_ todo: Todo, userId: String) {
        db.child(DBPaths.task(todo.id, for: userId)).updateChildValues(todo.dictionary)
    }

    func updateTasksOrder(_ todos: [Todo], userId: String) {
        var updates: [String: Any] = [:]
        for todo in todos {
            updates["\(DBPaths.task(todo.id, for: userId))/order"] = todo.order
        }
        db.updateChildValues(updates)
    }

    func moveTask(_ taskId: String, toFolder folderId: String?, userId: String) {
        let updates: [String: Any] = [
            "\(DBPaths.task(taskId, for: userId))/folderId": folderId ?? NSNull(),
            "\(DBPaths.task(taskId, for: userId))/order": -Date().millisecondsSince1970,
        ]
        db.updateChildValues(updates)
    }

    func deleteTask(_ taskId: String, userId: String) {
        db.child(DBPaths.task(taskId, for: userId)).removeValue()
    }

    // MARK: - Folders

    @discardableResult
    func createFolder(_ name: String, userId: String) -> String? {
        let timestamp = Date().millisecondsSince1970
        let ref = db.child(DBPaths.folders(for: userId)).childByAutoId()
        ref.setValue([
            "name": TodoFolder.cleanName(name),
            "createdAt": timestamp,
            "order": -timestamp,
        ])
        return ref.key
    }

    func renameFolder(_ folderId: String, name: String, userId: String) {
        let trimmed = TodoFolder.cleanName(name)
        guard !trimmed.isEmpty else { return }
        db.child("\(DBPaths.folder(folderId, for: userId))/name").setValue(trimmed)
    }

    func deleteFolder(_ folderId: String, userId: String, tasks: [Todo]) {
        var updates: [String: Any] = [:]
        updates[DBPaths.folder(folderId, for: userId)] = NSNull()
        for task in tasks where task.folderId == folderId {
            updates["\(DBPaths.task(task.id, for: userId))/folderId"] = NSNull()
        }
        db.updateChildValues(updates)
    }

    // MARK: - Account

    func deleteAllUserData(userId: String) async throws {
        try await db.updateChildValues([
            DBPaths.tasks(for: userId): NSNull(),
            DBPaths.folders(for: userId): NSNull(),
        ])
    }
}

extension DatabaseService {
    /// Writes many tasks in one multi-path update; ids come from the caller, so re-running overwrites.
    func importTasks(_ tasks: [Todo], userId: String) async throws {
        guard !tasks.isEmpty else { return }
        var updates: [String: Any] = [:]
        for task in tasks {
            updates[DBPaths.task(task.id, for: userId)] = task.dictionary.filter { !($0.value is NSNull) }
        }
        try await Database.database().reference().updateChildValues(updates)
    }
}
