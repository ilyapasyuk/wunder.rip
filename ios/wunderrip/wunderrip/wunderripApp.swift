//
//  wunderripApp.swift
//  wunderrip
//
//  Created by Ilya Pasyuk on 12/07/2026.
//

import FirebaseAuth
import FirebaseCore
import GoogleSignIn
import SwiftUI

@main
struct wunderripApp: App {
    @StateObject private var auth = AuthService.shared
    @StateObject private var appState = AppState()

    init() {
        FirebaseApp.configure()
        try? Auth.auth().useUserAccessGroup(SharedConfig.keychainAccessGroup)
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
