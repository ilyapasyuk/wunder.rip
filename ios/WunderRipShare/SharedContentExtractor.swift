import Foundation
import UIKit
import UniformTypeIdentifiers

struct ExtractedContent {
    var text: String?
    var imageData: Data?
}

enum SharedContentExtractor {
    static func extract(from attachments: [NSItemProvider]) async -> ExtractedContent {
        var text: String?
        var imageData: Data?

        for provider in attachments {
            if text == nil, provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                text = (try? await loadURL(provider))?.absoluteString
            }
            if text == nil, provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                text = try? await loadText(provider)
            }
            if imageData == nil, provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
                imageData = try? await loadImageData(provider)
            }
        }

        return ExtractedContent(text: text, imageData: imageData)
    }

    private static func loadURL(_ provider: NSItemProvider) async throws -> URL? {
        try await withCheckedThrowingContinuation { continuation in
            provider.loadItem(forTypeIdentifier: UTType.url.identifier) { item, error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: item as? URL)
                }
            }
        }
    }

    private static func loadText(_ provider: NSItemProvider) async throws -> String? {
        try await withCheckedThrowingContinuation { continuation in
            provider.loadItem(forTypeIdentifier: UTType.plainText.identifier) { item, error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: item as? String)
                }
            }
        }
    }

    private static func loadImageData(_ provider: NSItemProvider) async throws -> Data? {
        try await withCheckedThrowingContinuation { continuation in
            provider.loadItem(forTypeIdentifier: UTType.image.identifier) { item, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                if let url = item as? URL, let data = try? Data(contentsOf: url) {
                    continuation.resume(returning: data)
                } else if let image = item as? UIImage {
                    continuation.resume(returning: image.jpegData(compressionQuality: 0.85))
                } else if let data = item as? Data {
                    continuation.resume(returning: data)
                } else {
                    continuation.resume(returning: nil)
                }
            }
        }
    }
}
