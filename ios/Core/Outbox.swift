import Foundation

/// Items added outside the app (Share Extension, later Siri / widgets) that the app uploads to Firebase.
/// Extensions don't hold a Firebase session, so they only write here; `OutboxUploader` in the app drains it.
struct OutboxItem: Codable, Equatable, Identifiable {
    var id: String
    var userId: String
    var title: String
    var folderId: String?
    /// File name of an image next to the item in the outbox folder.
    var imageFile: String?
    var createdAt: Date
}

struct Outbox {
    let directory: URL

    init?(container: URL? = AppConfig.groupContainer) {
        guard let container else { return nil }
        directory = container.appendingPathComponent("Outbox", isDirectory: true)
    }

    init(directory: URL) {
        self.directory = directory
    }

    @discardableResult
    func enqueue(userId: String, title: String, folderId: String? = nil, imageData: Data? = nil, now: Date = .now) throws -> OutboxItem {
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let id = UUID().uuidString
        var item = OutboxItem(id: id, userId: userId, title: title, folderId: folderId, imageFile: nil, createdAt: now)
        if let imageData {
            item.imageFile = "\(id).jpg"
            try imageData.write(to: directory.appendingPathComponent(item.imageFile!), options: .atomic)
        }
        // The JSON is written last: a half-written item (image only) is never picked up.
        try JSONEncoder().encode(item).write(to: itemURL(id), options: .atomic)
        return item
    }

    /// Pending items, oldest first.
    func pending(for userId: String) -> [OutboxItem] {
        let files = (try? FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil)) ?? []
        return files
            .filter { $0.pathExtension == "json" }
            .compactMap { try? JSONDecoder().decode(OutboxItem.self, from: Data(contentsOf: $0)) }
            .filter { $0.userId == userId }
            .sorted { $0.createdAt < $1.createdAt }
    }

    func imageData(for item: OutboxItem) -> Data? {
        item.imageFile.flatMap { try? Data(contentsOf: directory.appendingPathComponent($0)) }
    }

    func remove(_ item: OutboxItem) {
        try? FileManager.default.removeItem(at: itemURL(item.id))
        if let imageFile = item.imageFile {
            try? FileManager.default.removeItem(at: directory.appendingPathComponent(imageFile))
        }
    }

    private func itemURL(_ id: String) -> URL {
        directory.appendingPathComponent("\(id).json")
    }
}
