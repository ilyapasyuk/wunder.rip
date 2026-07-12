import Foundation
import FirebaseDatabase

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

    private let db = Database.database().reference()

    private init() {}

    // MARK: - Observing

    func observeTasks(userId: String, onChange: @escaping ([Todo]) -> Void) -> DatabaseHandle {
        db.child(DBPaths.tasks(for: userId)).observe(.value) { snapshot in
            var result: [Todo] = []
            for case let child as DataSnapshot in snapshot.children {
                guard let dict = child.value as? [String: Any] else { continue }
                result.append(
                    Todo(
                        id: child.key,
                        task: dict["task"] as? String ?? "",
                        done: dict["done"] as? Bool ?? false,
                        createdAt: dict["createdAt"] as? Double ?? 0,
                        note: dict["note"] as? String ?? "",
                        files: dict["files"] as? [String] ?? [],
                        order: dict["order"] as? Double ?? 0,
                        isPublic: dict["isPublic"] as? Bool ?? false,
                        folderId: dict["folderId"] as? String
                    )
                )
            }
            result.sort { $0.order < $1.order }
            onChange(result)
        }
    }

    func stopObservingTasks(userId: String, handle: DatabaseHandle) {
        db.child(DBPaths.tasks(for: userId)).removeObserver(withHandle: handle)
    }

    func observeFolders(userId: String, onChange: @escaping ([TodoFolder]) -> Void) -> DatabaseHandle {
        db.child(DBPaths.folders(for: userId)).observe(.value) { snapshot in
            var result: [TodoFolder] = []
            for case let child as DataSnapshot in snapshot.children {
                guard let dict = child.value as? [String: Any] else { continue }
                result.append(
                    TodoFolder(
                        id: child.key,
                        name: dict["name"] as? String ?? "",
                        createdAt: dict["createdAt"] as? Double ?? 0,
                        order: dict["order"] as? Double ?? 0
                    )
                )
            }
            result.sort { $0.order < $1.order }
            onChange(result)
        }
    }

    func stopObservingFolders(userId: String, handle: DatabaseHandle) {
        db.child(DBPaths.folders(for: userId)).removeObserver(withHandle: handle)
    }

    // MARK: - Tasks

    @discardableResult
    func createTask(_ text: String, folderId: String?, userId: String) -> String? {
        let timestamp = Date().millisecondsSince1970
        let trimmed = String(text.prefix(100)).trimmingCharacters(in: .whitespacesAndNewlines)
        let ref = db.child(DBPaths.tasks(for: userId)).childByAutoId()
        let value: [String: Any] = [
            "task": trimmed,
            "done": false,
            "createdAt": timestamp,
            "files": [],
            "note": "",
            "order": -timestamp,
            "isPublic": false,
            "folderId": folderId ?? NSNull(),
        ]
        ref.setValue(value)
        return ref.key
    }

    func updateTask(_ todo: Todo, userId: String) {
        let path = DBPaths.task(todo.id, for: userId)
        let payload: [String: Any] = [
            "task": todo.task,
            "done": todo.done,
            "createdAt": todo.createdAt,
            "note": todo.note,
            "files": todo.files,
            "order": todo.order,
            "isPublic": todo.isPublic,
            "folderId": todo.folderId ?? NSNull(),
        ]
        db.child(path).updateChildValues(payload)
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
        let trimmed = String(name.prefix(60)).trimmingCharacters(in: .whitespacesAndNewlines)
        let ref = db.child(DBPaths.folders(for: userId)).childByAutoId()
        ref.setValue([
            "name": trimmed,
            "createdAt": timestamp,
            "order": -timestamp,
        ])
        return ref.key
    }

    func renameFolder(_ folderId: String, name: String, userId: String) {
        let trimmed = String(name.prefix(60)).trimmingCharacters(in: .whitespacesAndNewlines)
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

    func deleteAllUserData(userId: String, completion: @escaping (Error?) -> Void) {
        let group = DispatchGroup()
        var firstError: Error?

        group.enter()
        db.child(DBPaths.tasks(for: userId)).removeValue { error, _ in
            if let error { firstError = firstError ?? error }
            group.leave()
        }

        group.enter()
        db.child(DBPaths.folders(for: userId)).removeValue { error, _ in
            if let error { firstError = firstError ?? error }
            group.leave()
        }

        group.notify(queue: .main) {
            completion(firstError)
        }
    }
}

private extension Date {
    var millisecondsSince1970: Double { timeIntervalSince1970 * 1000 }
}
