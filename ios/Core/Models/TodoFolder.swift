import Foundation

struct TodoFolder: Identifiable, Equatable, Codable {
    var id: String
    var name: String
    var createdAt: Double
    var order: Double
}

extension TodoFolder {
    static let maxNameLength = 60

    init(id: String, dictionary dict: [String: Any]) {
        self.init(
            id: id,
            name: dict["name"] as? String ?? "",
            createdAt: (dict["createdAt"] as? NSNumber)?.doubleValue ?? 0,
            order: (dict["order"] as? NSNumber)?.doubleValue ?? 0
        )
    }

    static func cleanName(_ text: String) -> String {
        String(text.trimmingCharacters(in: .whitespacesAndNewlines).prefix(maxNameLength))
    }
}
