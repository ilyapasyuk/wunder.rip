import SwiftUI

struct SidebarView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var auth: AuthService

    @State private var newFolderName = ""
    @State private var renamingFolder: TodoFolder?
    @State private var renameText = ""
    @State private var folderPendingDelete: TodoFolder?

    var body: some View {
        List(selection: Binding(
            get: { appState.currentFolderId },
            set: { appState.currentFolderId = $0 }
        )) {
            let counts = appState.counts()

            Label {
                HStack {
                    Text("Inbox")
                    Spacer()
                    if counts["__inbox__", default: 0] > 0 {
                        Text("\(counts["__inbox__", default: 0])")
                            .foregroundStyle(.secondary)
                    }
                }
            } icon: {
                Image(systemName: "tray")
            }
            .tag(Optional<String>.none)

            Section("Lists") {
                ForEach(appState.folders) { folder in
                    HStack {
                        Text(folder.name)
                        Spacer()
                        let count = counts[folder.id, default: 0]
                        if count > 0 {
                            Text("\(count)").foregroundStyle(.secondary)
                        }
                    }
                    .tag(Optional.some(folder.id))
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
                }

                HStack {
                    Image(systemName: "plus")
                        .foregroundStyle(.secondary)
                    TextField("New list...", text: $newFolderName)
                        .onSubmit(createFolder)
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
                if let folder = renamingFolder, let userId = auth.user?.id {
                    DatabaseService.shared.renameFolder(folder.id, name: renameText, userId: userId)
                }
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
                if let folder = folderPendingDelete, let userId = auth.user?.id {
                    if appState.currentFolderId == folder.id {
                        appState.currentFolderId = nil
                    }
                    DatabaseService.shared.deleteFolder(folder.id, userId: userId, tasks: appState.todos)
                }
                folderPendingDelete = nil
            }
            Button("Cancel", role: .cancel) { folderPendingDelete = nil }
        }
    }

    private func createFolder() {
        let value = newFolderName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !value.isEmpty, let userId = auth.user?.id else { return }
        newFolderName = ""
        DatabaseService.shared.createFolder(value, userId: userId)
    }
}
