import SwiftUI

struct ShareView: View {
    let attachments: [NSItemProvider]
    let onFinish: () -> Void
    let onCancel: () -> Void

    @State private var taskText = ""
    @State private var previewImage: UIImage?
    @State private var pendingImageData: Data?
    @State private var isLoadingContent = true
    @State private var isSaving = false
    @State private var errorMessage: String?

    private var canSave: Bool {
        !isLoadingContent && !isSaving &&
            (!taskText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || pendingImageData != nil)
    }

    var body: some View {
        NavigationStack {
            Form {
                if isLoadingContent {
                    HStack {
                        ProgressView()
                        Text("Reading shared content...")
                    }
                } else {
                    Section("Add to Inbox") {
                        TextField("Task", text: $taskText, axis: .vertical)
                            .lineLimit(2 ... 5)
                    }
                    if let previewImage {
                        Section("Photo") {
                            Image(uiImage: previewImage)
                                .resizable()
                                .scaledToFit()
                                .frame(maxHeight: 160)
                        }
                    }
                }
                if let errorMessage {
                    Text(errorMessage).foregroundStyle(.red)
                }
            }
            .navigationTitle("wunder.rip")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", action: onCancel)
                }
                ToolbarItem(placement: .confirmationAction) {
                    if isSaving {
                        ProgressView()
                    } else {
                        Button("Add", action: save)
                            .disabled(!canSave)
                    }
                }
            }
        }
        .task {
            await loadContent()
        }
    }

    private func loadContent() async {
        let extracted = await SharedContentExtractor.extract(from: attachments)
        taskText = extracted.text ?? ""
        pendingImageData = extracted.imageData
        if let imageData = extracted.imageData {
            previewImage = UIImage(data: imageData)
        }
        isLoadingContent = false
    }

    private func save() {
        isSaving = true
        errorMessage = nil
        Task {
            do {
                try await ShareUploadService.addToInbox(
                    text: taskText.trimmingCharacters(in: .whitespacesAndNewlines),
                    imageData: pendingImageData
                )
                onFinish()
            } catch {
                errorMessage = error.localizedDescription
                isSaving = false
            }
        }
    }
}
