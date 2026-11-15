# wunder.rip for iOS

SwiftUI app for iPhone and iPad (iOS 26+) with a Share Extension. Same Firebase Realtime Database as the web app
(`todos/{uid}`, `folders/{uid}`), so tasks sync with notes.pasyuk.com and the MCP server. Free, no ads.

## Build
```bash
brew install xcodegen      # once
cd ios && xcodegen generate
open WunderRip.xcodeproj   # scheme WunderRip (app + Share Extension + tests)
```
`project.yml` is the source of truth; never edit the `.xcodeproj` by hand, regenerate it and commit both.
Tests: `xcodebuild -project WunderRip.xcodeproj -scheme WunderRip -destination 'platform=iOS Simulator,name=iPhone 18 Pro' test`

## Layout
| Folder | Targets | What |
| --- | --- | --- |
| `Core/` | app, share, tests (later widgets, watch) | Models + parsing of database nodes, `AppConfig` (App Group), `Outbox`, `SnapshotStore`. No Firebase here. |
| `Shared/` | app, share | `Localizable.xcstrings` (en, ru) |
| `WunderRip/` | app | Firebase services (auth, database), `AppState`, views |
| `WunderRipShare/` | share | Share sheet UI; writes to the outbox |
| `WunderRipTests/` | tests | Unit tests for `Core` (no host app) |

## How it works
- **Offline**: Firebase disk persistence + `keepSynced` on the user's paths; writes queue while offline.
  `AppState` also mirrors tasks and lists to `snapshot.json` in the App Group, so the app opens instantly
  and widgets / the watch app can read them without Firebase.
- **Share Extension** has no Firebase session (a shared keychain group broke the app's session before, see git history).
  It writes the item to `Outbox/` in the App Group; the app uploads it (image to Cloudinary, then the task)
  on launch, on sign-in and whenever it becomes active. The task key is `share-<id>`, so a retry overwrites instead of duplicating.
- **Sign-in**: Apple and Google via Firebase Auth. Deleting an account re-authenticates first, then removes data,
  then the user; for Apple it also revokes the token.

## Setup outside the repo
- Apple Developer: App IDs `com.ilyapasyuk.wunderrip` (+ `.Share`) with App Group `group.com.ilyapasyuk.wunderrip`;
  Sign in with Apple on the app ID. Automatic signing creates these when you build with your team.
- Firebase Console → Authentication → Sign-in method → enable **Apple**.
