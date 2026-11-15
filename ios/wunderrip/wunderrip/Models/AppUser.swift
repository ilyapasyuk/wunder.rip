import Foundation
import FirebaseAuth

struct AppUser: Equatable {
    var id: String
    var email: String
    var fullName: String
    var avatarURL: String

    init(id: String, email: String, fullName: String, avatarURL: String) {
        self.id = id
        self.email = email
        self.fullName = fullName
        self.avatarURL = avatarURL
    }

    init(firebaseUser: FirebaseAuth.User) {
        self.init(
            id: firebaseUser.uid,
            email: firebaseUser.email ?? "",
            fullName: firebaseUser.displayName ?? "",
            avatarURL: firebaseUser.photoURL?.absoluteString ?? ""
        )
    }
}
