import FirebaseAuth
import Foundation
import WidgetKit

/// Fans app state out to everything outside the app: widgets, the watch, reminders, and the Device API token.
/// `AppState` calls it; nothing else needs to know these exist.
@MainActor
final class SyncHub {
    static let shared = SyncHub()

    private var widgetReload: Task<Void, Never>?
    private var lastSnapshot: Snapshot?

    func activate() {
        Notifier.shared.activate()
        WatchLink.shared.activate()
    }

    func snapshotChanged(_ snapshot: Snapshot) {
        lastSnapshot = snapshot
        WatchLink.shared.push(WatchPayload(snapshot: snapshot, token: DeviceToken.load()))
        Task { await Notifier.shared.sync(snapshot.todos) }
        // Firebase can fire several times in a row; reload widgets once it settles.
        widgetReload?.cancel()
        widgetReload = Task {
            try? await Task.sleep(for: .seconds(1))
            guard !Task.isCancelled else { return }
            WidgetCenter.shared.reloadAllTimelines()
        }
    }

    /// After sign-in and on every launch: a fresh 30-day device token for extensions and the watch.
    func refreshDeviceToken() async {
        guard let user = Auth.auth().currentUser, let idToken = try? await user.getIDToken() else { return }
        guard let token = try? await DeviceAPI().createSession(idToken: idToken) else { return }
        token.save()
        WatchLink.shared.push(WatchPayload(snapshot: lastSnapshot, token: token))
        WidgetCenter.shared.reloadAllTimelines()
    }

    func signedOut() {
        lastSnapshot = nil
        DeviceToken.clear()
        Notifier.shared.clearAll()
        WatchLink.shared.push(WatchPayload(signedOut: true))
        WidgetCenter.shared.reloadAllTimelines()
    }
}
