import Foundation

/// Identifiers shared by the app, the Share Extension and (later) widgets and the watch app.
nonisolated enum AppConfig {
    static let appGroupID = "group.com.ilyapasyuk.wunderrip"
    static let databaseURL = "https://wundertodo-app.firebaseio.com"

    /// App Group container; nil only when the entitlement is missing (e.g. unit tests).
    static var groupContainer: URL? {
        FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupID)
    }

    static var groupDefaults: UserDefaults {
        UserDefaults(suiteName: appGroupID) ?? .standard
    }

    /// Written by the app on sign-in / sign-out so extensions know whose inbox to target.
    static var signedInUserId: String? {
        get { groupDefaults.string(forKey: "signedInUserId") }
        set { groupDefaults.set(newValue, forKey: "signedInUserId") }
    }
}
