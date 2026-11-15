import Foundation
import WatchConnectivity

/// What the iPhone hands to the watch: the latest tasks and the Device API token.
struct WatchPayload: Codable, Equatable {
    var snapshot: Snapshot?
    var token: DeviceToken?
    /// The user signed out on the phone: the watch forgets tasks and token.
    var signedOut = false
}

/// iPhone → Watch delivery over WatchConnectivity. Application context keeps only the latest payload,
/// so the watch gets the current state on its next launch even if it was off.
final class WatchLink: NSObject, WCSessionDelegate, @unchecked Sendable {
    static let shared = WatchLink()

    /// Watch side: called on the main actor with each payload from the phone.
    var onReceive: (@MainActor (WatchPayload) -> Void)?

    private var session: WCSession? { WCSession.isSupported() ? .default : nil }
    private var pending: WatchPayload?

    func activate() {
        session?.delegate = self
        session?.activate()
    }

    func push(_ payload: WatchPayload) {
        guard let session, session.activationState == .activated else {
            pending = payload
            return
        }
        #if os(iOS)
        guard session.isPaired, session.isWatchAppInstalled else { return }
        #endif
        guard let data = try? JSONEncoder().encode(payload) else { return }
        try? session.updateApplicationContext(["payload": data])
    }

    private func receive(_ context: [String: Any]) {
        guard let data = context["payload"] as? Data,
              let payload = try? JSONDecoder().decode(WatchPayload.self, from: data) else { return }
        Task { @MainActor in self.onReceive?(payload) }
    }

    func session(_ session: WCSession, activationDidCompleteWith _: WCSessionActivationState, error _: Error?) {
        if let pending {
            self.pending = nil
            push(pending)
        }
        if !session.receivedApplicationContext.isEmpty { receive(session.receivedApplicationContext) }
    }

    func session(_: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        receive(applicationContext)
    }

    #if os(iOS)
    func sessionDidBecomeInactive(_: WCSession) {}
    func sessionDidDeactivate(_ session: WCSession) { session.activate() }
    #endif
}
