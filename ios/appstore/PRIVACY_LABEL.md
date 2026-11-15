# App Privacy answers (App Store Connect → App Privacy)

Apple's public API has no endpoint for these answers, so they are entered by hand. They cover the **iOS app and its
extensions only** (app, Share Extension, widgets, Apple Watch app, Siri intent). The web app's Firebase Analytics
does not belong here: the iOS app links only `FirebaseAuth`, `FirebaseDatabase` and `GoogleSignIn` (see
`ios/project.yml`), with no analytics, crash reporting or ads SDK.

Privacy Policy URL: `https://notes.pasyuk.com/privacy`

## 1. Do you or your third-party partners collect data from this app?
**Yes, we collect data from this app.**

## 2. Data types: tick exactly these

| Category → type | Why it's collected | Source in the code |
| --- | --- | --- |
| Contact Info → **Email Address** | Sign in with Apple / Google; Firebase Auth keeps the account email (a relay address with Hide My Email) | `AuthService`, `AppUser.email` |
| Contact Info → **Name** | Apple or Google may provide the account name; shown on the Account screen | `AppUser.fullName` |
| User Content → **Photos or Videos** | Photos the user attaches to a task, or shares into the app, are uploaded to Cloudinary | `TaskDetailView` (PhotosPicker), `OutboxUploader` |
| User Content → **Other User Content** | Tasks, notes, lists, tags, checklists, dates and reminders, stored in Firebase Realtime Database to sync; also tasks imported from Apple Reminders and text/links from the share sheet | `DatabaseService`, `RemindersImporter`, `WunderRipShare` |
| Identifiers → **User ID** | Firebase Auth user ID; tasks are stored under it (`todos/{uid}`) and the device token carries it | `DBPaths`, `DeviceAPI` |

Do **not** tick: Health & Fitness, Financial Info, Location, Sensitive Info, Contacts, Emails or Text Messages,
Audio, Gameplay Content, Customer Support, Browsing History, Search History (search runs on the device), Device ID
(no IDFA/IDFV; the device token is a server session token, not a device identifier), Purchases, Product
Interaction, Advertising Data, Other Usage Data, Crash Data, Performance Data, Other Diagnostic Data, Other Data.

## 3. For **each** ticked type, answer the same way

| Question | Answer |
| --- | --- |
| Purposes | **App Functionality** only. Not Third-Party Advertising, Developer's Advertising or Marketing, Analytics, Product Personalization, or Other. |
| Is this data linked to the user's identity? | **Yes**, linked to the user (everything lives in the user's account). |
| Is this data used for tracking? | **No.** |

## 4. Resulting label on the App Store
- **Data Used to Track You:** none
- **Data Linked to You:** Contact Info (Email Address, Name), User Content (Photos or Videos, Other User Content), Identifiers (User ID)
- **Data Not Linked to You:** none

## Notes
- If an analytics or crash SDK (for example Firebase Analytics or Crashlytics) is ever added to the iOS app, these
  answers must change: add Usage Data / Diagnostics before shipping that build.
- Account deletion is in the app (Account → Delete Account), which App Review requires for apps with sign-in.
- Hide My Email doesn't change the answers: a relay address is still an email address linked to the account.
