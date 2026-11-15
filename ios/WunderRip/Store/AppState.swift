import Combine
import FirebaseDatabase
import Foundation
import UIKit

@MainActor
final class AppState: ObservableObject {
    @Published var todos: [Todo] = []
    @Published var folders: [TodoFolder] = []
    /// Sidebar selection. Optional because a compact split view clears it when you go back to the sidebar.
    @Published var destination: Destination? = .smart(.today)
    /// Task shown in the detail column. Lives here, not in a view, so it survives size-class changes (fold/unfold, iPad multitasking).
    @Published var selectedTaskId: String?
    /// The local calendar day; refreshed at midnight and when the app comes back.
    @Published private(set) var today = Day.today()

    /// DEBUG `-demo 1`: sample data, no Firebase; edits stay in memory.
    @Published private(set) var isDemo = false

    private var tasksHandle: DatabaseHandle?
    private var foldersHandle: DatabaseHandle?
    private var observedUserId: String?
    private var dayObserver: AnyCancellable?

    private let db = DatabaseService.shared

    init() {
        dayObserver = NotificationCenter.default.publisher(for: UIApplication.significantTimeChangeNotification)
            .merge(with: NotificationCenter.default.publisher(for: UIApplication.didBecomeActiveNotification))
            .sink { [weak self] _ in self?.refreshToday() }
    }

    func refreshToday() {
        let now = Day.today()
        if now != today { today = now }
    }

    func attach(userId: String?) {
        guard !isDemo, userId != observedUserId else { return }
        detach()
        observedUserId = userId
        guard let userId else { return }
        // Show the last known state immediately; Firebase replaces it as soon as it answers (from its disk cache or the server).
        if let snapshot = SnapshotStore.load(userId: userId) {
            todos = snapshot.todos
            folders = snapshot.folders
        }
        tasksHandle = db.observeTasks(userId: userId) { [weak self] todos in
            self?.todos = todos
            self?.saveSnapshot()
        }
        foldersHandle = db.observeFolders(userId: userId) { [weak self] folders in
            guard let self else { return }
            self.folders = folders
            self.saveSnapshot()
            if let destination = self.destination, !destination.exists(in: folders) {
                self.destination = .inbox
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
        destination = .smart(.today)
        selectedTaskId = nil
        observedUserId = nil
    }

    private func saveSnapshot() {
        guard let observedUserId else { return }
        let snapshot = Snapshot(userId: observedUserId, todos: todos, folders: folders, savedAt: .now)
        SnapshotStore.save(snapshot)
        SyncHub.shared.snapshotChanged(snapshot)
    }

    // MARK: - Reading

    func todo(id: String?) -> Todo? {
        guard let id else { return nil }
        return todos.first { $0.id == id }
    }

    func title(of destination: Destination) -> String {
        switch destination {
        case let .smart(list): list.title
        case .inbox: String(localized: "Inbox")
        case let .list(id): folders.first { $0.id == id }?.name ?? String(localized: "Inbox")
        }
    }

    var allTags: [String] { TagSuggestions.suggestions(for: "", in: todos, excluding: [], limit: .max) }

    // MARK: - Writing (Firebase, or memory in demo mode)

    /// Creates a task from the compose bar; a plan typed in the text wins over the current view's default.
    func create(_ entry: QuickEntry) {
        let title = Todo.cleanTitle(entry.title)
        guard !title.isEmpty else { return }
        let plan = entry.plan(in: destination ?? .inbox, today: today)
        if isDemo {
            var todo = Todo(id: "demo-\(UUID().uuidString)", dictionary: Todo.new(
                title: title, folderId: plan.folderId, when: plan.when, deadline: entry.deadline, tags: entry.tags
            ))
            todo.order = (todos.map(\.order).min() ?? 0) - 1
            todos.append(todo)
        } else if let userId = observedUserId {
            db.createTask(title, folderId: plan.folderId, when: plan.when, deadline: entry.deadline, tags: entry.tags, userId: userId)
        }
    }

    /// Every "done" toggle goes through here, so completion always follows the model (repeats, completedAt).
    func toggleDone(_ todo: Todo) {
        todo.done ? reopen(todo) : complete(todo)
    }

    func complete(_ todo: Todo) {
        refreshToday()
        if isDemo {
            let (completed, next) = todo.complete(today: today, now: Date().millisecondsSince1970, nextId: "demo-\(UUID().uuidString)")
            replace(completed)
            if let next { todos.append(next) }
        } else if let userId = observedUserId {
            db.complete(todo, today: today, userId: userId)
        }
    }

    func reopen(_ todo: Todo) {
        if isDemo {
            replace(todo.reopened())
        } else if let userId = observedUserId {
            db.reopen(todo, userId: userId)
        }
    }

    func update(_ todo: Todo) {
        if isDemo {
            replace(todo)
        } else if let userId = observedUserId {
            db.updateTask(todo, userId: userId)
        }
    }

    func delete(_ todo: Todo) {
        if selectedTaskId == todo.id { selectedTaskId = nil }
        if isDemo {
            todos.removeAll { $0.id == todo.id }
        } else if let userId = observedUserId {
            db.deleteTask(todo.id, userId: userId)
        }
    }

    func move(_ todo: Todo, to folderId: String?) {
        if isDemo {
            var moved = todo
            moved.folderId = folderId
            moved.order = -Date().millisecondsSince1970
            replace(moved)
        } else if let userId = observedUserId {
            db.moveTask(todo.id, toFolder: folderId, userId: userId)
        }
    }

    /// Drag-to-reorder inside `items` (one section): renumbers just those tasks.
    func reorder(_ items: [Todo], moving draggedId: String, onto targetId: String) {
        var items = items
        guard draggedId != targetId,
              let from = items.firstIndex(where: { $0.id == draggedId }),
              let to = items.firstIndex(where: { $0.id == targetId })
        else { return }
        items.insert(items.remove(at: from), at: to)
        for index in items.indices { items[index].order = Double(index) }
        if isDemo {
            items.forEach(replace)
        } else if let userId = observedUserId {
            db.updateTasksOrder(items, userId: userId)
        }
    }

    func createFolder(_ name: String) {
        let value = TodoFolder.cleanName(name)
        guard !value.isEmpty else { return }
        if isDemo {
            folders.append(TodoFolder(id: "demo-\(UUID().uuidString)", name: value, createdAt: 0, order: Double(folders.count)))
        } else if let userId = observedUserId {
            db.createFolder(value, userId: userId)
        }
    }

    func renameFolder(_ folder: TodoFolder, to name: String) {
        let value = TodoFolder.cleanName(name)
        guard !value.isEmpty else { return }
        if isDemo {
            if let index = folders.firstIndex(where: { $0.id == folder.id }) { folders[index].name = value }
        } else if let userId = observedUserId {
            db.renameFolder(folder.id, name: value, userId: userId)
        }
    }

    func deleteFolder(_ folder: TodoFolder) {
        if destination == .list(folder.id) { destination = .inbox }
        if isDemo {
            folders.removeAll { $0.id == folder.id }
            for index in todos.indices where todos[index].folderId == folder.id { todos[index].folderId = nil }
        } else if let userId = observedUserId {
            db.deleteFolder(folder.id, userId: userId, tasks: todos)
        }
    }

    private func replace(_ todo: Todo) {
        if let index = todos.firstIndex(where: { $0.id == todo.id }) { todos[index] = todo }
    }

    // MARK: - Outside the app (notifications, widgets)

    /// Hooks notification buttons to the same writes the UI uses.
    func connectNotifications() {
        Notifier.shared.onComplete = { [weak self] taskId in
            guard let self, let todo = self.todo(id: taskId) else { return }
            self.complete(todo)
        }
        Notifier.shared.onSnooze = { [weak self] taskId, until in
            guard let self, let todo = self.todo(id: taskId) else { return }
            self.update(todo.snoozed(until: until))
        }
    }

    /// `wunderrip://today`, `wunderrip://inbox`, `wunderrip://task/<id>` (from widgets).
    @discardableResult
    func open(_ url: URL) -> Bool {
        guard url.scheme == "wunderrip" else { return false }
        switch url.host() {
        case "today": destination = .smart(.today)
        case "inbox": destination = .inbox
        case "task":
            let id = url.lastPathComponent
            guard let todo = todo(id: id) else { return true }
            destination = destination ?? .smart(todo.placement(today: today).list)
            selectedTaskId = id
        default: return false
        }
        return true
    }

    // MARK: - Demo

    #if DEBUG
    func startDemo(todos: [Todo], folders: [TodoFolder]) {
        detach()
        isDemo = true
        self.todos = todos
        self.folders = folders
    }
    #endif
}
