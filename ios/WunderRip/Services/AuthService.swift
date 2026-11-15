import AuthenticationServices
import Combine
import CryptoKit
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
            let user = firebaseUser.map { AppUser(firebaseUser: $0) }
            self?.user = user
            self?.isLoading = false
            AppConfig.signedInUserId = user?.id
        }
    }

    // MARK: - Google

    func signInWithGoogle() async throws {
        try await signIn(with: googleCredential())
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

    // MARK: - Apple

    private var pendingAppleNonce: String?

    /// Pass to `SignInWithAppleButton(onRequest:)`; remembers the nonce for `completeAppleSignIn`.
    func prepareAppleRequest(_ request: ASAuthorizationAppleIDRequest) {
        let nonce = Self.randomNonce()
        pendingAppleNonce = nonce
        request.requestedScopes = [.fullName, .email]
        request.nonce = Self.sha256(nonce)
    }

    /// Pass the result of `SignInWithAppleButton(onCompletion:)`.
    func completeAppleSignIn(_ result: Result<ASAuthorization, Error>) async throws {
        let authorization = try result.get()
        guard let nonce = pendingAppleNonce else { throw AuthError.missingIDToken }
        pendingAppleNonce = nil
        let (credential, fullName) = try Self.appleCredential(from: authorization, nonce: nonce)
        try await signIn(with: credential)

        // Apple sends the name only on the very first sign-in; keep it as the display name.
        if let user = Auth.auth().currentUser, (user.displayName ?? "").isEmpty,
           let fullName, let name = Self.format(fullName) {
            let change = user.createProfileChangeRequest()
            change.displayName = name
            try? await change.commitChanges()
            self.user = AppUser(firebaseUser: user)
        }
    }

    private static func appleCredential(from authorization: ASAuthorization, nonce: String) throws -> (OAuthCredential, PersonNameComponents?) {
        guard
            let apple = authorization.credential as? ASAuthorizationAppleIDCredential,
            let tokenData = apple.identityToken,
            let idToken = String(data: tokenData, encoding: .utf8)
        else {
            throw AuthError.missingIDToken
        }
        let credential = OAuthProvider.appleCredential(withIDToken: idToken, rawNonce: nonce, fullName: apple.fullName)
        return (credential, apple.fullName)
    }

    private static func format(_ name: PersonNameComponents) -> String? {
        let formatted = PersonNameComponentsFormatter.localizedString(from: name, style: .default)
        return formatted.isEmpty ? nil : formatted
    }

    // MARK: - Session

    private func signIn(with credential: AuthCredential) async throws {
        do {
            try await Auth.auth().signIn(with: credential)
        } catch let error as NSError where error.code == AuthErrorCode.accountExistsWithDifferentCredential.rawValue {
            throw AuthError.accountExistsWithOtherProvider
        }
    }

    func signOut() {
        try? Auth.auth().signOut()
        GIDSignIn.sharedInstance.signOut()
        SnapshotStore.clear()
    }

    // MARK: - Account deletion

    /// Step 1 of deletion: proves it's really the owner (fresh sign-in) before anything is removed.
    /// For Apple accounts it also revokes the Sign in with Apple token, as App Review requires.
    func reauthenticateForDeletion() async throws {
        guard let currentUser = Auth.auth().currentUser else { throw AuthError.notSignedIn }
        let providers = currentUser.providerData.map(\.providerID)

        if providers.contains("apple.com") {
            let nonce = Self.randomNonce()
            let authorization = try await AppleReauthorizer().run(hashedNonce: Self.sha256(nonce))
            let (credential, _) = try Self.appleCredential(from: authorization, nonce: nonce)
            _ = try await currentUser.reauthenticate(with: credential)
            if let apple = authorization.credential as? ASAuthorizationAppleIDCredential,
               let codeData = apple.authorizationCode,
               let code = String(data: codeData, encoding: .utf8) {
                try await Auth.auth().revokeToken(withAuthorizationCode: code)
            }
        } else {
            _ = try await currentUser.reauthenticate(with: googleCredential())
        }
    }

    /// Step 2 of deletion, after the user's data is gone.
    func deleteCurrentUser() async throws {
        guard let currentUser = Auth.auth().currentUser else { throw AuthError.notSignedIn }
        try await currentUser.delete()
        GIDSignIn.sharedInstance.signOut()
        SnapshotStore.clear()
    }

    // MARK: - Helpers

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

    private static func randomNonce(length: Int = 32) -> String {
        let charset = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var generator = SystemRandomNumberGenerator()
        return String((0 ..< length).map { _ in charset.randomElement(using: &generator)! })
    }

    private static func sha256(_ input: String) -> String {
        SHA256.hash(data: Data(input.utf8)).map { String(format: "%02x", $0) }.joined()
    }

    enum AuthError: LocalizedError {
        case missingClientID
        case noPresentingController
        case missingIDToken
        case notSignedIn
        case accountExistsWithOtherProvider

        var errorDescription: String? {
            switch self {
            case .missingClientID: String(localized: "Missing Google client ID.")
            case .noPresentingController: String(localized: "No view to present sign-in from.")
            case .missingIDToken: String(localized: "Sign-in did not return an ID token.")
            case .notSignedIn: String(localized: "You're not signed in.")
            case .accountExistsWithOtherProvider:
                String(localized: "This email is already registered with another sign-in method. Use the one you signed up with.")
            }
        }
    }
}

/// Runs a one-off Sign in with Apple prompt outside of `SignInWithAppleButton` (used to confirm account deletion).
@MainActor
private final class AppleReauthorizer: NSObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    private var continuation: CheckedContinuation<ASAuthorization, Error>?

    func run(hashedNonce: String) async throws -> ASAuthorization {
        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.nonce = hashedNonce
        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self
        return try await withCheckedThrowingContinuation { continuation in
            self.continuation = continuation
            controller.performRequests()
        }
    }

    nonisolated func authorizationController(controller _: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        MainActor.assumeIsolated {
            continuation?.resume(returning: authorization)
            continuation = nil
        }
    }

    nonisolated func authorizationController(controller _: ASAuthorizationController, didCompleteWithError error: Error) {
        MainActor.assumeIsolated {
            continuation?.resume(throwing: error)
            continuation = nil
        }
    }

    nonisolated func presentationAnchor(for _: ASAuthorizationController) -> ASPresentationAnchor {
        MainActor.assumeIsolated {
            UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap(\.windows)
                .first(where: \.isKeyWindow) ?? ASPresentationAnchor()
        }
    }
}
