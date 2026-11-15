import SwiftUI

/// Sidebar → list → task. Three columns when wide (iPad, unfolded foldable), a stack when compact.
/// All selection lives in `AppState`, so it survives switching between the two.
struct WorkspaceView: View {
    @EnvironmentObject private var appState: AppState
    @State private var showAccount = false
    @State private var columns = NavigationSplitViewVisibility.all
    @State private var preferredCompactColumn = NavigationSplitViewColumn.content
    /// Kept here so a half-typed task survives changing lists or size class.
    @State private var composeText = ""

    var body: some View {
        NavigationSplitView(columnVisibility: $columns, preferredCompactColumn: $preferredCompactColumn) {
            SidebarView()
                .navigationSplitViewColumnWidth(min: 220, ideal: 260)
                .toolbar {
                    if !appState.isDemo {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button {
                                showAccount = true
                            } label: {
                                Image(systemName: "person.circle")
                            }
                            .accessibilityLabel(Text("Account"))
                        }
                    }
                }
        } content: {
            if let destination = appState.destination {
                TaskListView(destination: destination, composeText: $composeText)
                    .navigationSplitViewColumnWidth(min: 320, ideal: 400)
            } else {
                ContentUnavailableView("Choose a list", systemImage: "sidebar.left")
            }
        } detail: {
            if let todo = appState.todo(id: appState.selectedTaskId) {
                TaskDetailView(todo: todo)
                    .id(todo.id)
            } else {
                ContentUnavailableView("No task selected", systemImage: "checklist")
            }
        }
        .onChange(of: appState.destination) { _, _ in
            // A task from another list shouldn't stay open beside the new one.
            if let id = appState.selectedTaskId, let destination = appState.destination,
               !destination.sections(of: appState.todos, today: appState.today).contains(where: { $0.todos.contains { $0.id == id } }) {
                appState.selectedTaskId = nil
            }
        }
        .onAppear {
            if appState.destination == nil { preferredCompactColumn = .sidebar }
            #if DEBUG
            if appState.isDemo { composeText = DemoData.composeText }
            #endif
        }
        .sheet(isPresented: $showAccount) {
            NavigationStack {
                AccountView()
            }
        }
    }
}
