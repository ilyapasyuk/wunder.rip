The killed ~Kenny~ Wunderlist

<img width="1563" height="1061" alt="Screenshot 2026-05-22 at 00 55 49" src="https://github.com/user-attachments/assets/90ec398c-b34a-48d9-b761-df04fedbfdb9" />
<img width="1563" height="1061" alt="Screenshot 2026-05-22 at 00 56 38" src="https://github.com/user-attachments/assets/b96e0c94-bf74-4e48-bfbf-dcdaabbe4f66" />

## MCP server

`api/` deploys a remote MCP server (Streamable HTTP) alongside the app, so an MCP client (Claude Code, Claude Desktop, etc.) can create/read/update/delete tasks and lists on your behalf. Auth is "Sign in with Google" — same idea as the Lokalize backend's `/auth/google` flow: Google OAuth2 authorization code → verified email → our own signed bearer token. The token holder's email is resolved to the matching Firebase Auth uid (Admin SDK), so the MCP server acts on the exact same account/data as the web app.

Visit `/api/mcp` in a browser for a live version of the steps below.

### One-time setup (manual, requires console access)

1. **Google OAuth client** — in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) for the `wundertodo-app` project: configure the OAuth consent screen if needed (Testing mode + add yourself as a test user is enough), then create an **OAuth client ID** of type "Web application" with authorized redirect URI:
   `https://<your-deployment-domain>/api/auth/google/callback`
2. **Firebase service account** — Firebase Console → Project settings → Service accounts (project `wundertodo-app`) → *Generate new private key*. This lets the server read/write the Realtime Database directly via the Admin SDK (bypassing client security rules), scoped server-side to only the allowed email's uid.
3. **Vercel env vars** — set on the project:
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — from step 1
   - `FIREBASE_SERVICE_ACCOUNT` — full JSON key from step 2, as one line
   - `ALLOWED_EMAIL` — the Google account you sign into wunder.rip with; only this identity is granted access
   - `MCP_TOKEN_SECRET` — random secret used to sign issued bearer tokens (e.g. `openssl rand -hex 32`)
   - `MCP_TOKEN_TTL_DAYS` — optional, default `180`
   - `MCP_PUBLIC_URL` — optional, only needed if the auto-detected request host is wrong (e.g. behind a proxy)

   Realtime Database paths reuse the existing `VITE_APP_DB_TASK_NAME` / `VITE_APP_DB_FOLDER_NAME` project variables (already set per environment) — nothing extra to add there.
4. Deploy (`vercel --prod` or a push to the production branch).

### Connecting a client

1. Open `https://<your-deployment-domain>/api/auth/google` and sign in with the allowed Google account.
2. Copy the bearer token shown on the result page.
3. Add the server to your MCP client, e.g. for Claude Code:
   ```
   claude mcp add --transport http wunder-rip https://<your-deployment-domain>/api/mcp --header "Authorization: Bearer <token>"
   ```

The token expires after `MCP_TOKEN_TTL_DAYS` — repeat step 1 to mint a new one.
