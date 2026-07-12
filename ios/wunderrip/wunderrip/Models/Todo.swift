import Foundation

struct Todo: Identifiable, Equatable {
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
