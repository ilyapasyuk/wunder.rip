import AuthenticationServices
import SwiftUI

struct AccountView: View {
    @EnvironmentObject private var auth: AuthService
    @Environment(\.dismiss) private var dismiss
    @State private var showDeleteConfirm = false
    @State private var isDeleting = false
    @State private var errorMessage: String?
    @State private var isImporting = false
    @State private var importResult: String?
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Form {
            if let user = auth.user {
                Section {
                    HStack(spacing: 12) {
                        AsyncImage(url: URL(string: user.avatarURL)) { image in
                            image.resizable().scaledToFill()
                        } placeholder: {
                            Image(systemName: "person.circle.fill")
                                .resizable()
                                .foregroundStyle(.secondary)
                        }
                        .frame(width: 48, height: 48)
                        .clipShape(Circle())

                        VStack(alignment: .leading) {
                            Text(user.fullName.isEmpty ? user.email : user.fullName)
                                .font(.headline)
                            if !user.fullName.isEmpty {
                                Text(user.email)
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }

            Section {
                Button {
                    importReminders()
                } label: {
                    HStack {
                        Label("Import from Reminders", systemImage: "square.and.arrow.down")
                        if isImporting {
                            Spacer()
                            ProgressView()
                        }
                    }
                }
                .disabled(isImporting)
            } footer: {
                if let importResult { Text(importResult) }
            }

            Section {
                Button("Sign Out", role: .destructive) {
                    auth.signOut()
                    dismiss()
                }
            }

            Section {
                Button("Delete Account", role: .destructive) {
                    showDeleteConfirm = true
                }
            } footer: {
                Text("This permanently deletes your tasks, lists, and account. This cannot be undone.")
            }

            if let errorMessage {
                Text(errorMessage).foregroundStyle(.red)
            }
        }
        .navigationTitle("Account")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Done") { dismiss() }
            }
        }
        .disabled(isDeleting)
        .overlay {
            if isDeleting {
                ProgressView()
            }
        }
        .confirmationDialog(
            "Delete your account? This removes all tasks and lists and cannot be undone.",
            isPresented: $showDeleteConfirm,
            titleVisibility: .visible
        ) {
            Button("Delete Account", role: .destructive) {
                deleteAccount()
            }
            Button("Cancel", role: .cancel) {}
        }
    }

    private func importReminders() {
        guard let userId = auth.user?.id else { return }
        isImporting = true
        importResult = nil
        Task {
            defer { isImporting = false }
            do {
                let count = try await RemindersImporter.run(userId: userId, existingFolders: appState.folders)
                importResult = String(localized: "Imported \(count) tasks.")
            } catch {
                importResult = error.localizedDescription
            }
        }
    }

    private func deleteAccount() {
        guard let userId = auth.user?.id else { return }
        isDeleting = true
        errorMessage = nil
        Task {
            defer { isDeleting = false }
            do {
                // Re-authenticate first: if the user cancels, nothing has been deleted yet.
                try await auth.reauthenticateForDeletion()
                try await DatabaseService.shared.deleteAllUserData(userId: userId)
                try await auth.deleteCurrentUser()
                dismiss()
            } catch let error as ASAuthorizationError where error.code == .canceled {
                // Cancelled the confirmation sign-in.
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}
