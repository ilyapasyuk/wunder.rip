import SwiftUI

struct TaskListView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var auth: AuthService
    @State private var newTaskText = ""

    var body: some View {
        List {
            Section {
                if appState.visibleTodos.isEmpty {
                    Text("No tasks yet")
                        .foregroundStyle(.secondary)
                }
                ForEach(appState.visibleTodos) { todo in
                    NavigationLink(value: todo.id) {
                        TaskRowView(todo: todo, onToggle: { toggleDone(todo) })
                    }
                    .swipeActions(edge: .trailing) {
                        Button(role: .destructive) {
                            deleteTask(todo)
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                    }
                    .swipeActions(edge: .leading) {
                        Button {
                            toggleDone(todo)
                        } label: {
                            Label(
                                todo.done ? "Undone" : "Done",
                                systemImage: todo.done ? "arrow.uturn.left" : "checkmark"
                            )
                        }
                        .tint(todo.done ? .gray : .green)
                    }
                    .contextMenu {
                        moveMenu(for: todo)
                    }
                    .draggable(todo.id) {
                        TaskRowView(todo: todo, onToggle: {})
                            .padding(8)
                            .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 10))
                    }
                    .dropDestination(for: String.self) { draggedIds, _ in
                        guard let draggedId = draggedIds.first else { return false }
                        reorder(draggedId: draggedId, target: todo.id)
                        return true
                    }
                }
            }
        }
        .navigationTitle(appState.currentFolderName)
        .navigationDestination(for: String.self) { taskId in
            if let todo = appState.todos.first(where: { $0.id == taskId }) {
                TaskDetailView(todo: todo)
            }
        }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            composeBar
        }
    }

    private var composeBar: some View {
        HStack(spacing: 10) {
            Image(systemName: "plus.circle.fill")
                .font(.title2)
                .foregroundStyle(.tint)
            TextField("New task...", text: $newTaskText)
                .onSubmit(addTask)
            if !newTaskText.isEmpty {
                Button("Add", action: addTask)
                    .fontWeight(.semibold)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 20))
        .padding(.horizontal, 12)
        .padding(.top, 8)
        .background(.bar)
    }

    @ViewBuilder
    private func moveMenu(for todo: Todo) -> some View {
        if todo.folderId != nil {
            Button {
                move(todo, to: nil)
            } label: {
                Label("Move to Inbox", systemImage: "tray")
            }
        }
        ForEach(appState.folders.filter { $0.id != todo.folderId }) { folder in
            Button {
                move(todo, to: folder.id)
            } label: {
                Label("Move to \(folder.name)", systemImage: "folder")
            }
        }
    }

    private func addTask() {
        let value = Todo.cleanTitle(newTaskText)
        guard !value.isEmpty, let userId = auth.user?.id else { return }
        newTaskText = ""
        DatabaseService.shared.createTask(value, folderId: appState.currentFolderId, userId: userId)
    }

    private func toggleDone(_ todo: Todo) {
        guard let userId = auth.user?.id else { return }
        var updated = todo
        updated.done.toggle()
        DatabaseService.shared.updateTask(updated, userId: userId)
    }

    private func deleteTask(_ todo: Todo) {
        guard let userId = auth.user?.id else { return }
        DatabaseService.shared.deleteTask(todo.id, userId: userId)
    }

    private func move(_ todo: Todo, to folderId: String?) {
        guard let userId = auth.user?.id else { return }
        DatabaseService.shared.moveTask(todo.id, toFolder: folderId, userId: userId)
    }

    private func reorder(draggedId: String, target targetId: String) {
        guard draggedId != targetId, let userId = auth.user?.id else { return }
        var items = appState.visibleTodos
        guard
            let fromIndex = items.firstIndex(where: { $0.id == draggedId }),
            let toIndex = items.firstIndex(where: { $0.id == targetId })
        else { return }
        let item = items.remove(at: fromIndex)
        items.insert(item, at: toIndex)
        for index in items.indices {
            items[index].order = Double(index)
        }
        DatabaseService.shared.updateTasksOrder(items, userId: userId)
    }
}
