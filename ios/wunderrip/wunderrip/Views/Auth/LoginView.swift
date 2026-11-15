import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var auth: AuthService
    @State private var errorMessage: String?
    @State private var isSigningIn = false

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            VStack(spacing: 8) {
                Image(systemName: "checklist")
                    .font(.system(size: 56))
                    .foregroundStyle(.tint)
                Text("wunder.rip")
                    .font(.largeTitle.bold())
                Text("The killed Wunderlist")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Spacer()

            Button(action: signIn) {
                HStack {
                    if isSigningIn {
                        ProgressView().tint(.white)
                    } else {
                        Image(systemName: "g.circle.fill")
                    }
                    Text("Sign in with Google")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 4)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .disabled(isSigningIn)
            .padding(.horizontal, 32)

            if let errorMessage {
                Text(errorMessage)
                    .font(.footnote)
                    .foregroundStyle(.red)
                    .padding(.horizontal, 32)
                    .multilineTextAlignment(.center)
            }
            Spacer()
        }
    }

    private func signIn() {
        errorMessage = nil
        isSigningIn = true
        Task {
            do {
                try await auth.signInWithGoogle()
            } catch {
                errorMessage = error.localizedDescription
            }
            isSigningIn = false
        }
    }
}

#Preview {
    LoginView().environmentObject(AuthService.shared)
}
