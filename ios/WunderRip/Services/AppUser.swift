import FirebaseAuth
import Foundation

struct AppUser: Equatable {
    var id: String
    var email: String
    var fullName: String
    var avatarURL: String
    /// Firebase provider IDs, e.g. "google.com", "apple.com".
    var providers: [String]

    init(firebaseUser: FirebaseAuth.User) {
        id = firebaseUser.uid
        email = firebaseUser.email ?? ""
        fullName = firebaseUser.displayName ?? ""
        avatarURL = firebaseUser.photoURL?.absoluteString ?? ""
        providers = firebaseUser.providerData.map(\.providerID)
    }
}
