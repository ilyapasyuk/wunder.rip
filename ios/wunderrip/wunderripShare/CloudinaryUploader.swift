import Foundation

enum CloudinaryUploader {
    private static let cloudName = "dpihljzyg"
    private static let uploadPreset = "wunderrip_task"

    enum UploadError: LocalizedError {
        case failed(String)

        var errorDescription: String? {
            switch self {
            case let .failed(message): return message
            }
        }
    }

    static func upload(imageData: Data) async throws -> String {
        guard let url = URL(string: "https://api.cloudinary.com/v1_1/\(cloudName)/image/upload") else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        let boundary = "Boundary-\(UUID().uuidString)"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.httpBody = multipartBody(boundary: boundary, imageData: imageData)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200 ..< 300).contains(http.statusCode) else {
            let message = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])
                .flatMap { ($0["error"] as? [String: Any])?["message"] as? String }
            throw UploadError.failed(message ?? "Upload failed")
        }
        guard
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
            let publicId = json["public_id"] as? String
        else {
            throw UploadError.failed("Unexpected response from image upload.")
        }
        return publicId
    }

    private static func multipartBody(boundary: String, imageData: Data) -> Data {
        var body = Data()
        func append(_ string: String) {
            body.append(string.data(using: .utf8)!)
        }
        append("--\(boundary)\r\n")
        append("Content-Disposition: form-data; name=\"upload_preset\"\r\n\r\n")
        append("\(uploadPreset)\r\n")
        append("--\(boundary)\r\n")
        append("Content-Disposition: form-data; name=\"file\"; filename=\"photo.jpg\"\r\n")
        append("Content-Type: image/jpeg\r\n\r\n")
        body.append(imageData)
        append("\r\n--\(boundary)--\r\n")
        return body
    }
}
