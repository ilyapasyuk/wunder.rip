import FirebaseAuth
import FirebaseCore
import Foundation

enum ShareUploadService {
    enum ShareError: LocalizedError {
        case notSignedIn
        case writeFailed(String)

        var errorDescription: String? {
            switch self {
            case .notSignedIn: return "Sign in to wunder.rip in the app first."
            case let .writeFailed(message): return message
            }
        }
    }

    static func addToInbox(text: String, imageData: Data?) async throws {
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }
        try Auth.auth().useUserAccessGroup(SharedConfig.keychainAccessGroup)

        guard let user = Auth.auth().currentUser else {
            throw ShareError.notSignedIn
        }
        let idToken = try await user.getIDToken()

        var files: [String] = []
        if let imageData {
            let publicId = try await CloudinaryUploader.upload(imageData: imageData)
            files = [publicId]
        }

        let timestamp = Date().millisecondsSince1970
        let task = text.isEmpty ? "Shared photo" : String(text.prefix(100))
        let payload: [String: Any] = [
            "task": task,
            "done": false,
            "createdAt": timestamp,
            "files": files,
            "note": "",
            "order": -timestamp,
            "isPublic": false,
            "folderId": NSNull(),
        ]

        guard
            var components = URLComponents(string: "\(SharedConfig.databaseURL)/todos/\(user.uid).json")
        else {
            throw ShareError.writeFailed("Bad URL")
        }
        components.queryItems = [URLQueryItem(name: "auth", value: idToken)]

        guard let url = components.url else {
            throw ShareError.writeFailed("Bad URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200 ..< 300).contains(http.statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "Request failed"
            throw ShareError.writeFailed(message)
        }
    }
}

private extension Date {
    var millisecondsSince1970: Double { timeIntervalSince1970 * 1000 }
}
