import Combine
import FirebaseAuth
import FirebaseCore
import Foundation
import GoogleSignIn
import UIKit

@MainActor
final class AuthService: ObservableObject {
    static let shared = AuthService()

    @Published var user: AppUser?
    @Published var isLoading = true

    private var authHandle: AuthStateDidChangeListenerHandle?

    private init() {
        authHandle = Auth.auth().addStateDidChangeListener { [weak self] _, firebaseUser in
            self?.user = firebaseUser.map { AppUser(firebaseUser: $0) }
            self?.isLoading = false
        }
    }

    func signInWithGoogle() async throws {
        let credential = try await googleCredential()
        try await Auth.auth().signIn(with: credential)
    }

    func signOut() {
        try? Auth.auth().signOut()
        GIDSignIn.sharedInstance.signOut()
    }

    func deleteAccount() async throws {
        guard let currentUser = Auth.auth().currentUser else {
            throw AuthError.notSignedIn
        }
        let credential = try await googleCredential()
        _ = try await currentUser.reauthenticate(with: credential)
        try await currentUser.delete()
    }

    private func googleCredential() async throws -> AuthCredential {
        guard let clientID = FirebaseApp.app()?.options.clientID else {
            throw AuthError.missingClientID
        }
        GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientID)

        guard let presenter = Self.topViewController() else {
            throw AuthError.noPresentingController
        }

        let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: presenter)
        guard let idToken = result.user.idToken?.tokenString else {
            throw AuthError.missingIDToken
        }
        return GoogleAuthProvider.credential(
            withIDToken: idToken,
            accessToken: result.user.accessToken.tokenString
        )
    }

    private static func topViewController() -> UIViewController? {
        guard
            let scene = UIApplication.shared.connectedScenes
                .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene,
            let root = scene.windows.first(where: \.isKeyWindow)?.rootViewController
        else {
            return nil
        }
        var top = root
        while let presented = top.presentedViewController {
            top = presented
        }
        return top
    }

    enum AuthError: LocalizedError {
        case missingClientID
        case noPresentingController
        case missingIDToken
        case notSignedIn

        var errorDescription: String? {
            switch self {
            case .missingClientID: return "Missing Google client ID."
            case .noPresentingController: return "No view to present sign-in from."
            case .missingIDToken: return "Google sign-in did not return an ID token."
            case .notSignedIn: return "You're not signed in."
            }
        }
    }
}
