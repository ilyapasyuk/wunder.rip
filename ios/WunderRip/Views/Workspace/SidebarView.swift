import SwiftUI

struct SidebarView: View {
    @EnvironmentObject private var appState: AppState

    @State private var newFolderName = ""
    @State private var renamingFolder: TodoFolder?
    @State private var renameText = ""
    @State private var folderPendingDelete: TodoFolder?

    var body: some View {
        List(selection: $appState.destination) {
            Section {
                ForEach(SmartList.allCases, id: \.self) { list in
                    row(.smart(list), title: list.title)
                }
            }

            Section {
                row(.inbox, title: String(localized: "Inbox"))
            }

            Section("Lists") {
                ForEach(appState.folders) { folder in
                    row(.list(folder.id), title: folder.name)
                        .swipeActions(edge: .trailing) {
                            Button(role: .destructive) {
                                folderPendingDelete = folder
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                            Button {
                                renamingFolder = folder
                                renameText = folder.name
                            } label: {
                                Label("Rename", systemImage: "pencil")
                            }
                            .tint(.orange)
                        }
                        .contextMenu {
                            Button {
                                renamingFolder = folder
                                renameText = folder.name
                            } label: {
                                Label("Rename", systemImage: "pencil")
                            }
                            Button(role: .destructive) {
                                folderPendingDelete = folder
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                }

                HStack {
                    Image(systemName: "plus")
                        .foregroundStyle(.secondary)
                    TextField("New list...", text: $newFolderName)
                        .onSubmit {
                            appState.createFolder(newFolderName)
                            newFolderName = ""
                        }
                }
            }
        }
        .navigationTitle("wunder.rip")
        .alert(
            "Rename list",
            isPresented: Binding(
                get: { renamingFolder != nil },
                set: { if !$0 { renamingFolder = nil } }
            )
        ) {
            TextField("Name", text: $renameText)
            Button("Cancel", role: .cancel) { renamingFolder = nil }
            Button("Save") {
                if let folder = renamingFolder { appState.renameFolder(folder, to: renameText) }
                renamingFolder = nil
            }
        }
        .confirmationDialog(
            "Delete \"\(folderPendingDelete?.name ?? "")\"? Tasks will move to Inbox.",
            isPresented: Binding(
                get: { folderPendingDelete != nil },
                set: { if !$0 { folderPendingDelete = nil } }
            ),
            titleVisibility: .visible
        ) {
            Button("Delete List", role: .destructive) {
                if let folder = folderPendingDelete { appState.deleteFolder(folder) }
                folderPendingDelete = nil
            }
            Button("Cancel", role: .cancel) { folderPendingDelete = nil }
        }
    }

    private func row(_ destination: Destination, title: String) -> some View {
        Label {
            HStack {
                Text(title)
                Spacer()
                if let count = destination.badgeCount(of: appState.todos, today: appState.today), count > 0 {
                    Text("\(count)")
                        .foregroundStyle(destination == .smart(.today) ? AnyShapeStyle(.primary) : AnyShapeStyle(.secondary))
                        .monospacedDigit()
                }
            }
        } icon: {
            Image(systemName: destination.symbol)
                .foregroundStyle(destination.color)
        }
        .tag(destination)
    }
}
