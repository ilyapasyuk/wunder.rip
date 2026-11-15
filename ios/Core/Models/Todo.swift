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

    // Planning fields (shared/DATA_MODEL.md). Missing in old data = defaults.
    var when: When = .anytime
    var deadline: Day? = nil
    var repeatRule: RepeatRule? = nil
    var checklist: [ChecklistItem] = []
    var tags: [String] = []
    var completedAt: Double? = nil
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
            folderId: dict["folderId"] as? String,
            when: Self.parseWhen(dict),
            deadline: (dict["deadline"] as? String).flatMap(Day.init),
            repeatRule: RepeatRule(dictionary: dict["repeat"] as? [String: Any]),
            checklist: (dict["checklist"] as? [[String: Any]] ?? []).compactMap(ChecklistItem.init(dictionary:)),
            tags: Self.normalizedTags((dict["tags"] as? [Any] ?? []).compactMap { $0 as? String }),
            completedAt: (dict["completedAt"] as? NSNumber)?.doubleValue
        )
    }

    /// Trimmed, no blanks, no case-insensitive duplicates (first spelling wins).
    static func normalizedTags(_ tags: [String]) -> [String] {
        var seen = Set<String>()
        return tags
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty && seen.insert($0.lowercased()).inserted }
    }

    private static func parseWhen(_ dict: [String: Any]) -> When {
        switch dict["when"] as? String {
        case "someday": return .someday
        case let raw?:
            guard let day = Day(raw) else { return .anytime }
            return .day(day, evening: dict["evening"] as? Bool ?? false, reminder: (dict["reminder"] as? String).flatMap(TimeOfDay.init))
        case nil: return .anytime
        }
    }

    /// The planning fields in database form; `NSNull` removes a cleared field.
    var planDictionary: [String: Any] {
        let whenValue: Any = switch when {
        case .anytime: NSNull()
        case .someday: "someday"
        case let .day(day, _, _): day.string
        }
        return [
            "when": whenValue,
            "evening": when.isEvening,
            "reminder": when.reminder?.string ?? NSNull(),
            "deadline": deadline?.string ?? NSNull(),
            "repeat": repeatRule?.dictionary ?? NSNull(),
            "checklist": checklist.map(\.dictionary),
            "tags": tags,
            "completedAt": completedAt ?? NSNull(),
        ]
    }

    /// Payload for writing the whole task; `NSNull` clears the folder (Inbox).
    var dictionary: [String: Any] {
        planDictionary.merging([
            "task": task,
            "done": done,
            "createdAt": createdAt,
            "note": note,
            "files": files,
            "order": order,
            "isPublic": isPublic,
            "folderId": folderId ?? NSNull(),
        ]) { _, base in base }
    }

    /// A fresh task as the web app creates it: newest first (`order = -createdAt`).
    static func new(
        title: String, folderId: String?, files: [String] = [],
        when: When = .anytime, deadline: Day? = nil, tags: [String] = [], now: Date = .now
    ) -> [String: Any] {
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
            folderId: folderId,
            when: when,
            deadline: deadline,
            tags: tags
        ).dictionary
    }

    static func cleanTitle(_ text: String) -> String {
        String(text.trimmingCharacters(in: .whitespacesAndNewlines).prefix(maxTitleLength))
    }
}

extension Date {
    var millisecondsSince1970: Double { timeIntervalSince1970 * 1000 }
}
