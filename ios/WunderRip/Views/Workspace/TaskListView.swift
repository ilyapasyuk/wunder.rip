import SwiftUI

/// The middle column: the sections of the selected destination, or search results across all tasks.
struct TaskListView: View {
    let destination: Destination

    @EnvironmentObject private var appState: AppState
    @Binding var composeText: String
    @State private var query = ""
    @State private var planning: Todo?
    /// Bumped when a swipe completes a task (a tapped checkbox gives its own feedback).
    @State private var completedBySwipe = 0

    private var today: Day { appState.today }
    private var sections: [TaskSection] { destination.sections(of: appState.todos, today: today) }
    private var searching: Bool { !query.trimmingCharacters(in: .whitespaces).isEmpty }
    private var canReorder: Bool {
        switch destination {
        case .inbox, .list: true
        case .smart: false
        }
    }

    var body: some View {
        List(selection: $appState.selectedTaskId) {
            if searching {
                let results = TaskSearch.filter(appState.todos, query: query)
                ForEach(results) { row($0, in: results) }
            } else {
                ForEach(sections) { section in
                    Section {
                        ForEach(section.todos) { row($0, in: section.todos) }
                    } header: {
                        header(section.kind)
                    }
                }
            }
        }
        .animation(.snappy, value: sections.map(\.todos.count))
        .sensoryFeedback(.success, trigger: completedBySwipe)
        .overlay { emptyState }
        .navigationTitle(appState.title(of: destination))
        .searchable(text: $query, prompt: Text("Search all tasks"))
        .safeAreaInset(edge: .bottom, spacing: 0) {
            if destination != .smart(.logbook), !searching {
                ComposeBar(text: $composeText)
            }
        }
        .confirmationDialog("When", isPresented: Binding(get: { planning != nil }, set: { if !$0 { planning = nil } }), titleVisibility: .visible) {
            if let todo = planning {
                ForEach(QuickWhen.allCases, id: \.self) { quick in
                    Button(quick.title) { plan(todo, quick) }
                }
            }
        }
    }

    // MARK: - Rows

    private func row(_ todo: Todo, in items: [Todo]) -> some View {
        TaskRowView(todo: todo, today: today, destination: searching ? .inbox : destination) {
            appState.toggleDone(todo)
        }
        .tag(todo.id)
        .swipeActions(edge: .leading) {
            Button {
                if !todo.done { completedBySwipe += 1 }
                withAnimation(.snappy) { appState.toggleDone(todo) }
            } label: {
                Label(todo.done ? "Undone" : "Done", systemImage: todo.done ? "arrow.uturn.left" : "checkmark")
            }
            .tint(todo.done ? .gray : .green)
        }
        .swipeActions(edge: .trailing) {
            Button(role: .destructive) {
                appState.delete(todo)
            } label: {
                Label("Delete", systemImage: "trash")
            }
            if !todo.done {
                Button {
                    planning = todo
                } label: {
                    Label("When", systemImage: "calendar")
                }
                .tint(SmartList.upcoming.color)
            }
        }
        .contextMenu { contextMenu(for: todo) }
        .modifier(ReorderModifier(enabled: canReorder && !searching, todo: todo) { draggedId in
            appState.reorder(items, moving: draggedId, onto: todo.id)
        })
    }

    @ViewBuilder
    private func contextMenu(for todo: Todo) -> some View {
        Button {
            appState.toggleDone(todo)
        } label: {
            Label(todo.done ? "Undone" : "Done", systemImage: todo.done ? "arrow.uturn.left" : "checkmark")
        }
        if !todo.done {
            Menu {
                ForEach(QuickWhen.allCases, id: \.self) { quick in
                    Button { plan(todo, quick) } label: { Label(quick.title, systemImage: quick.symbol) }
                }
            } label: {
                Label("When", systemImage: "calendar")
            }
        }
        Menu {
            if todo.folderId != nil {
                Button { appState.move(todo, to: nil) } label: { Label("Inbox", systemImage: "tray") }
            }
            ForEach(appState.folders.filter { $0.id != todo.folderId }) { folder in
                Button { appState.move(todo, to: folder.id) } label: { Label(folder.name, systemImage: "list.bullet") }
            }
        } label: {
            Label("Move", systemImage: "folder")
        }
        Button(role: .destructive) {
            appState.delete(todo)
        } label: {
            Label("Delete", systemImage: "trash")
        }
    }

    private func plan(_ todo: Todo, _ quick: QuickWhen) {
        var updated = todo
        updated.when = todo.when.applying(quick, today: today)
        withAnimation(.snappy) { appState.update(updated) }
        planning = nil
    }

    // MARK: - Headers and empty states

    @ViewBuilder
    private func header(_ kind: TaskSection.Kind) -> some View {
        switch kind {
        case .tasks:
            EmptyView()
        case .evening:
            Label("This Evening", systemImage: "sunset.fill")
                .foregroundStyle(Color.eveningBlue)
        case let .day(day):
            Text(RelativeDay(day, today: today).header(today: today))
        case .done:
            Text("Completed")
        }
    }

    @ViewBuilder
    private var emptyState: some View {
        if searching {
            if TaskSearch.filter(appState.todos, query: query).isEmpty {
                ContentUnavailableView.search(text: query)
            }
        } else if sections.isEmpty {
            ContentUnavailableView {
                Label(emptyTitle, systemImage: destination.symbol)
                    .foregroundStyle(destination.color)
            } description: {
                Text(emptyMessage)
            }
        }
    }

    private var emptyTitle: LocalizedStringKey {
        switch destination {
        case .smart(.today): "Nothing for today"
        case .smart(.upcoming): "Nothing planned"
        case .smart(.logbook): "No completed tasks"
        default: "No tasks yet"
        }
    }

    private var emptyMessage: LocalizedStringKey {
        switch destination {
        case .smart(.logbook): "Completed tasks show up here."
        case .smart(.upcoming): "Try typing \"tomorrow\" or \"friday\" in a new task."
        default: "Add a task below."
        }
    }
}

/// Drag a row onto another to reorder (Inbox and lists only; smart lists are ordered by their rules).
private struct ReorderModifier: ViewModifier {
    let enabled: Bool
    let todo: Todo
    let onDrop: (String) -> Void

    func body(content: Content) -> some View {
        if enabled {
            content
                .draggable(todo.id) {
                    Text(todo.task)
                        .padding(8)
                        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 10))
                }
                .dropDestination(for: String.self) { ids, _ in
                    guard let id = ids.first else { return false }
                    onDrop(id)
                    return true
                }
        } else {
            content
        }
    }
}
