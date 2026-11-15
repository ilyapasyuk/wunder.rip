import PhotosUI
import SwiftUI

struct TaskDetailView: View {
    let todo: Todo
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var auth: AuthService

    @State private var taskText: String
    @State private var noteText: String
    @State private var selectedPhotoItem: PhotosPickerItem?
    @State private var isUploading = false
    @State private var uploadError: String?

    init(todo: Todo) {
        self.todo = todo
        _taskText = State(initialValue: todo.task)
        _noteText = State(initialValue: todo.note)
    }

    private var liveTodo: Todo {
        appState.todos.first(where: { $0.id == todo.id }) ?? todo
    }

    var body: some View {
        Form {
            Section("Task") {
                TextField("Task", text: $taskText, axis: .vertical)
                    .onSubmit(commitTask)
            }

            Section("Note") {
                TextField("Add a note...", text: $noteText, axis: .vertical)
                    .lineLimit(4 ... 10)
            }

            Section("Photos") {
                let files = liveTodo.files
                if !files.isEmpty {
                    ScrollView(.horizontal) {
                        HStack {
                            ForEach(files, id: \.self) { fileId in
                                imageThumb(fileId)
                            }
                        }
                    }
                }
                PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                    if isUploading {
                        ProgressView()
                    } else {
                        Label("Add Photo", systemImage: "photo.badge.plus")
                    }
                }
                .disabled(isUploading)
                .onChange(of: selectedPhotoItem) { _, newItem in
                    uploadPhoto(newItem)
                }
                if let uploadError {
                    Text(uploadError)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }
            }
        }
        .navigationTitle("Task")
        .navigationBarTitleDisplayMode(.inline)
        .onDisappear {
            commitTask()
            commitNote()
        }
    }

    @ViewBuilder
    private func imageThumb(_ fileId: String) -> some View {
        if let url = CloudinaryService.thumbURL(id: fileId, width: 200, height: 200) {
            AsyncImage(url: url) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                ProgressView()
            }
            .frame(width: 90, height: 90)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(alignment: .topTrailing) {
                Button {
                    removePhoto(fileId)
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.white, .black.opacity(0.6))
                }
                .padding(4)
            }
        }
    }

    private func commitTask() {
        guard let userId = auth.user?.id else { return }
        let trimmed = Todo.cleanTitle(taskText)
        guard !trimmed.isEmpty, trimmed != liveTodo.task else { return }
        var updated = liveTodo
        updated.task = trimmed
        DatabaseService.shared.updateTask(updated, userId: userId)
    }

    private func commitNote() {
        guard let userId = auth.user?.id else { return }
        guard noteText != liveTodo.note else { return }
        var updated = liveTodo
        updated.note = noteText
        DatabaseService.shared.updateTask(updated, userId: userId)
    }

    private func uploadPhoto(_ item: PhotosPickerItem?) {
        guard let item, let userId = auth.user?.id else { return }
        isUploading = true
        uploadError = nil
        Task {
            defer {
                isUploading = false
                selectedPhotoItem = nil
            }
            do {
                guard let data = try await item.loadTransferable(type: Data.self) else { return }
                let publicId = try await CloudinaryService.upload(imageData: data)
                var updated = liveTodo
                updated.files.append(publicId)
                DatabaseService.shared.updateTask(updated, userId: userId)
            } catch {
                uploadError = error.localizedDescription
            }
        }
    }

    private func removePhoto(_ fileId: String) {
        guard let userId = auth.user?.id else { return }
        var updated = liveTodo
        updated.files.removeAll { $0 == fileId }
        DatabaseService.shared.updateTask(updated, userId: userId)
    }
}
