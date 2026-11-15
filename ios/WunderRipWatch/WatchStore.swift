import Combine
import Foundation
import SwiftUI

/// Watch state: the last tasks from the phone (or the API), and actions that go straight to the Device API.
@MainActor
final class WatchStore: ObservableObject {
    @Published private(set) var todos: [Todo] = []
    @Published private(set) var token: DeviceToken?
    @Published var errorMessage: String?

    private let folder = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    private var userId = ""
    private lazy var api = DeviceAPI(token: { [weak self] in
        MainActor.assumeIsolated { self?.token?.value }
    })

    init() {
        token = DeviceToken.load(container: folder)
        if let snapshot = SnapshotStore.loadAny(container: folder) {
            userId = snapshot.userId
            todos = snapshot.todos
        }
        WatchLink.shared.onReceive = { [weak self] payload in self?.apply(payload) }
        WatchLink.shared.activate()
    }

    var isSignedIn: Bool { token != nil }

    func apply(_ payload: WatchPayload) {
        if let token = payload.token {
            self.token = token
            token.save(container: folder)
        }
        if let snapshot = payload.snapshot {
            userId = snapshot.userId
            todos = snapshot.todos
            SnapshotStore.save(snapshot, container: folder)
        }
    }

    func today(_ day: Day = .today()) -> (main: [Todo], evening: [Todo]) {
        var main: [Todo] = [], evening: [Todo] = []
        for todo in todos {
            let placement = todo.placement(today: day)
            guard placement.list == .today else { continue }
            if placement.evening { evening.append(todo) } else { main.append(todo) }
        }
        return (main, evening)
    }

    var inbox: [Todo] { todos.filter { $0.folderId == nil && !$0.done } }

    func refresh() async {
        guard isSignedIn else { return }
        do {
            let snapshot = try await api.snapshot()
            todos = snapshot.todos
            SnapshotStore.save(Snapshot(userId: userId, todos: snapshot.todos, folders: snapshot.folders, savedAt: .now), container: folder)
        } catch {
            report(error)
        }
    }

    func complete(_ todo: Todo) {
        let before = todos
        let result = todo.complete(today: .today(), now: Date.now.millisecondsSince1970, nextId: "pending-\(todo.id)")
        replace(todo.id, with: [result.completed] + (result.next.map { [$0] } ?? []))
        Task {
            do {
                _ = try await api.complete(taskId: todo.id, today: .today())
                await refresh()
            } catch {
                todos = before
                report(error)
            }
        }
    }

    func add(_ title: String, today day: Day = .today()) {
        let title = Todo.cleanTitle(title)
        guard !title.isEmpty else { return }
        let id = "watch-\(UUID().uuidString)"
        let when = When.day(day, evening: false, reminder: nil)
        var todo = Todo(id: id, task: title, done: false, createdAt: Date.now.millisecondsSince1970, note: "", files: [],
                        order: -Date.now.millisecondsSince1970, isPublic: false, folderId: nil)
        todo.when = when
        todos.insert(todo, at: 0)
        Task {
            do {
                try await api.create(id: id, title: title, when: when, folderId: nil)
            } catch {
                todos.removeAll { $0.id == id }
                report(error)
            }
        }
    }

    private func replace(_ id: String, with items: [Todo]) {
        guard let index = todos.firstIndex(where: { $0.id == id }) else { return }
        todos.replaceSubrange(index ... index, with: items)
    }

    private func report(_ error: Error) {
        if (error as? DeviceAPI.Failure) == .signedOut {
            token = nil
            DeviceToken.clear(container: folder)
            errorMessage = String(localized: "Open wunder.rip on your iPhone to sign in.")
        } else {
            errorMessage = String(localized: "No connection. Try again.")
        }
    }
}
