import FirebaseCore
import GoogleSignIn
import SwiftUI

@main
struct WunderRipApp: App {
    @StateObject private var auth: AuthService
    @StateObject private var appState: AppState

    init() {
        FirebaseApp.configure()
        DatabaseService.enableOfflinePersistence()
        _auth = StateObject(wrappedValue: AuthService.shared)
        _appState = StateObject(wrappedValue: AppState())
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(auth)
                .environmentObject(appState)
                .onOpenURL { url in
                    GIDSignIn.sharedInstance.handle(url)
                }
        }
    }
}
