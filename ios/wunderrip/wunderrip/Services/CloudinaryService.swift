import Foundation

enum CloudinaryConfig {
    static let cloudName = "dpihljzyg"
    static let uploadPreset = "wunderrip_task"
    static var deliveryBase: String { "https://res.cloudinary.com/\(cloudName)/image/upload" }
    static var uploadEndpoint: String { "https://api.cloudinary.com/v1_1/\(cloudName)/image/upload" }
}

enum CloudinaryService {
    enum CloudinaryError: LocalizedError {
        case uploadFailed(String)
        case invalidResponse

        var errorDescription: String? {
            switch self {
            case let .uploadFailed(message): return message
            case .invalidResponse: return "Unexpected response from image upload."
            }
        }
    }

    static func upload(imageData: Data, fileName: String = "photo.jpg") async throws -> String {
        guard let url = URL(string: CloudinaryConfig.uploadEndpoint) else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        let boundary = "Boundary-\(UUID().uuidString)"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.httpBody = multipartBody(boundary: boundary, imageData: imageData, fileName: fileName)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200 ..< 300).contains(http.statusCode) else {
            let message = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])
                .flatMap { ($0["error"] as? [String: Any])?["message"] as? String }
            throw CloudinaryError.uploadFailed(message ?? "Upload failed")
        }
        guard
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
            let publicId = json["public_id"] as? String
        else {
            throw CloudinaryError.invalidResponse
        }
        return publicId
    }

    private static func multipartBody(boundary: String, imageData: Data, fileName: String) -> Data {
        var body = Data()
        func append(_ string: String) {
            body.append(string.data(using: .utf8)!)
        }
        append("--\(boundary)\r\n")
        append("Content-Disposition: form-data; name=\"upload_preset\"\r\n\r\n")
        append("\(CloudinaryConfig.uploadPreset)\r\n")
        append("--\(boundary)\r\n")
        append("Content-Disposition: form-data; name=\"file\"; filename=\"\(fileName)\"\r\n")
        append("Content-Type: image/jpeg\r\n\r\n")
        body.append(imageData)
        append("\r\n--\(boundary)--\r\n")
        return body
    }

    static func thumbURL(id: String, width: Int, height: Int) -> URL? {
        URL(string: "\(CloudinaryConfig.deliveryBase)/f_auto,q_auto:eco,c_fill,g_auto,w_\(width),h_\(height),dpr_auto/\(id)")
    }

    static func previewURL(id: String, maxWidth: Int = 2000) -> URL? {
        URL(string: "\(CloudinaryConfig.deliveryBase)/f_auto,q_auto:best,c_limit,w_\(maxWidth),dpr_auto/\(id)")
    }
}
