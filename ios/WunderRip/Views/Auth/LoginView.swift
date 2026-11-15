import AuthenticationServices
import GoogleSignIn
import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var auth: AuthService
    @Environment(\.colorScheme) private var colorScheme
    @State private var errorMessage: String?
    @State private var isSigningIn = false

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            VStack(spacing: 8) {
                Image(systemName: "checklist")
                    .font(.system(size: 56))
                    .foregroundStyle(.tint)
                Text(verbatim: "wunder.rip")
                    .font(.largeTitle.bold())
                Text("The killed Wunderlist")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Spacer()

            VStack(spacing: 12) {
                SignInWithAppleButton(.signIn) { request in
                    auth.prepareAppleRequest(request)
                } onCompletion: { result in
                    run { try await auth.completeAppleSignIn(result) }
                }
                .signInWithAppleButtonStyle(colorScheme == .dark ? .white : .black)
                .frame(height: 50)
                .clipShape(Capsule())

                Button {
                    run { try await auth.signInWithGoogle() }
                } label: {
                    HStack {
                        Image(systemName: "g.circle.fill")
                        Text("Sign in with Google")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity, minHeight: 36)
                }
                .buttonStyle(.bordered)
                .buttonBorderShape(.capsule)
                .controlSize(.large)
            }
            .disabled(isSigningIn)
            .overlay {
                if isSigningIn { ProgressView() }
            }
            .frame(maxWidth: 400)
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

    private func run(_ action: @escaping () async throws -> Void) {
        errorMessage = nil
        isSigningIn = true
        Task {
            do {
                try await action()
            } catch let error as ASAuthorizationError where error.code == .canceled {
                // User closed the Apple sheet: not an error.
            } catch let error as GIDSignInError where error.code == .canceled {
                // Same for Google.
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
