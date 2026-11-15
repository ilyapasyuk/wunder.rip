import Foundation

struct Todo: Identifiable, Equatable, Codable {
    var id: String
    var task: String
    var done: Bool
    var createdAt: Double
    var note: String
    var files: [String]
    var order: Double
    var isPublic: Bool
    var folderId: String?
}

extension Todo {
    /// Max title length; the web app uses the same limit.
    static let maxTitleLength = 100

    /// Parses a Realtime Database node (`todos/{uid}/{id}`), tolerating missing fields and numbers stored as Int.
    init(id: String, dictionary dict: [String: Any]) {
        self.init(
            id: id,
            task: dict["task"] as? String ?? "",
            done: dict["done"] as? Bool ?? false,
            createdAt: (dict["createdAt"] as? NSNumber)?.doubleValue ?? 0,
            note: dict["note"] as? String ?? "",
            files: dict["files"] as? [String] ?? [],
            order: (dict["order"] as? NSNumber)?.doubleValue ?? 0,
            isPublic: dict["isPublic"] as? Bool ?? false,
            folderId: dict["folderId"] as? String
        )
    }

    /// Payload for writing the whole task; `NSNull` clears the folder (Inbox).
    var dictionary: [String: Any] {
        [
            "task": task,
            "done": done,
            "createdAt": createdAt,
            "note": note,
            "files": files,
            "order": order,
            "isPublic": isPublic,
            "folderId": folderId ?? NSNull(),
        ]
    }

    /// A fresh task as the web app creates it: newest first (`order = -createdAt`).
    static func new(title: String, folderId: String?, files: [String] = [], now: Date = .now) -> [String: Any] {
        let timestamp = now.millisecondsSince1970
        return Todo(
            id: "",
            task: cleanTitle(title),
            done: false,
            createdAt: timestamp,
            note: "",
            files: files,
            order: -timestamp,
            isPublic: false,
            folderId: folderId
        ).dictionary
    }

    static func cleanTitle(_ text: String) -> String {
        String(text.trimmingCharacters(in: .whitespacesAndNewlines).prefix(maxTitleLength))
    }
}

extension Date {
    var millisecondsSince1970: Double { timeIntervalSince1970 * 1000 }
}
