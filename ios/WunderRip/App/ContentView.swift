import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var auth: AuthService
    @EnvironmentObject private var appState: AppState
    @Environment(\.scenePhase) private var scenePhase

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
        .onAppear { userChanged(auth.user?.id) }
        .onChange(of: auth.user?.id) { _, newId in userChanged(newId) }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active, let userId = auth.user?.id {
                OutboxUploader.shared.drain(userId: userId)
            }
        }
    }

    private func userChanged(_ userId: String?) {
        appState.attach(userId: userId)
        if let userId {
            OutboxUploader.shared.drain(userId: userId)
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthService.shared)
        .environmentObject(AppState())
}
