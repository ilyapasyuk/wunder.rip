import SwiftUI

struct TaskListView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var auth: AuthService
    @State private var newTaskText = ""

    var body: some View {
        List {
            Section {
                HStack {
                    Image(systemName: "plus.circle.fill")
                        .foregroundStyle(.tint)
                    TextField("New task...", text: $newTaskText)
                        .onSubmit(addTask)
                }
            }

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
                }
            }
        }
        .navigationTitle(appState.currentFolderName)
        .navigationDestination(for: String.self) { taskId in
            if let todo = appState.todos.first(where: { $0.id == taskId }) {
                TaskDetailView(todo: todo)
            }
        }
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
        let value = newTaskText.trimmingCharacters(in: .whitespacesAndNewlines)
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
}
