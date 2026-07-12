import Combine
import FirebaseDatabase
import Foundation

@MainActor
final class AppState: ObservableObject {
    @Published var todos: [Todo] = []
    @Published var folders: [TodoFolder] = []
    @Published var currentFolderId: String?

    private var tasksHandle: DatabaseHandle?
    private var foldersHandle: DatabaseHandle?
    private var observedUserId: String?

    private let db = DatabaseService.shared

    func attach(userId: String?) {
        guard userId != observedUserId else { return }
        detach()
        observedUserId = userId
        guard let userId else { return }
        tasksHandle = db.observeTasks(userId: userId) { [weak self] todos in
            self?.todos = todos
        }
        foldersHandle = db.observeFolders(userId: userId) { [weak self] folders in
            guard let self else { return }
            self.folders = folders
            if let currentFolderId = self.currentFolderId, !folders.contains(where: { $0.id == currentFolderId }) {
                self.currentFolderId = nil
            }
        }
    }

    func detach() {
        if let observedUserId {
            if let tasksHandle {
                db.stopObservingTasks(userId: observedUserId, handle: tasksHandle)
            }
            if let foldersHandle {
                db.stopObservingFolders(userId: observedUserId, handle: foldersHandle)
            }
        }
        tasksHandle = nil
        foldersHandle = nil
        todos = []
        folders = []
        currentFolderId = nil
        observedUserId = nil
    }

    var visibleTodos: [Todo] {
        todos.filter { $0.folderId == currentFolderId }
    }

    var currentFolderName: String {
        guard let currentFolderId else { return "Inbox" }
        return folders.first(where: { $0.id == currentFolderId })?.name ?? "Inbox"
    }

    func counts() -> [String: Int] {
        var map: [String: Int] = ["__inbox__": 0]
        for todo in todos where !todo.done {
            let key = todo.folderId ?? "__inbox__"
            map[key, default: 0] += 1
        }
        return map
    }
}
