//
//  ContentView.swift
//  wunderrip
//
//  Created by Ilya Pasyuk on 12/07/2026.
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var auth: AuthService
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Group {
            if auth.isLoading {
                ProgressView()
            } else if auth.user != nil {
                WorkspaceView()
            } else {
                LoginView()
            }
        }
        .onAppear {
            appState.attach(userId: auth.user?.id)
        }
        .onChange(of: auth.user?.id) { _, newId in
            appState.attach(userId: newId)
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthService.shared)
        .environmentObject(AppState())
}
