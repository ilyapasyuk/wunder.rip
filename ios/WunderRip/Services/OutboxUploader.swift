import Foundation

/// Uploads tasks queued by the Share Extension (see `Outbox`). Runs on launch, on sign-in and whenever the app becomes active.
@MainActor
final class OutboxUploader {
    static let shared = OutboxUploader()

    private var isRunning = false

    func drain(userId: String) {
        guard !isRunning, let outbox = Outbox() else { return }
        let items = outbox.pending(for: userId)
        guard !items.isEmpty else { return }
        isRunning = true
        Task {
            defer { isRunning = false }
            for item in items {
                do {
                    var files: [String] = []
                    if let data = outbox.imageData(for: item) {
                        files = [try await CloudinaryService.upload(imageData: data)]
                    }
                    let title = item.title.isEmpty ? String(localized: "Shared photo") : item.title
                    try await DatabaseService.shared.createTaskConfirmed(key: "share-\(item.id)", title, folderId: item.folderId, files: files, userId: userId)
                    outbox.remove(item)
                } catch {
                    // Offline or upload failed: keep the item and retry next time the app is active.
                    return
                }
            }
        }
    }
}
