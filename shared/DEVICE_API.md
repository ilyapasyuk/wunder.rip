# Device API

HTTPS API on the worker (`/api/device/*`) for clients that can't hold a Firebase session:
iOS widgets, Siri / App Intents, the Share Extension and the Apple Watch app.

## Auth
- `POST /api/device/session` `{ "idToken": "<Firebase ID token>" }` → `{ "token": "…", "expiresAt": <ms> }`
  The iOS app calls this after sign-in and on every launch (sliding 30-day expiry) and stores the token in the
  App Group; the watch receives it from the phone.
- Every other call: `Authorization: Bearer <token>`. `401` = sign in again in the app.

## Calls
All bodies are JSON. Task fields follow `shared/DATA_MODEL.md` (raw database form).

| Call | Body | Result |
| --- | --- | --- |
| `GET /api/device/snapshot` | — | `{ "todos": { "<id>": <task> }, "folders": { "<id>": <folder> } }` |
| `PUT /api/device/tasks/<id>` | new task (`task`, optional `folderId`, `when`, `evening`, `reminder`, `deadline`, `tags`, `files`) | `{ "id": "<id>" }` |
| `POST /api/device/tasks/<id>/complete` | `{ "today": "YYYY-MM-DD" }` | `{ "nextId": "<id>" \| null }` |
| `POST /api/device/tasks/<id>/reopen` | — | `{}` |
| `PATCH /api/device/tasks/<id>` | planning fields to change (`when`, `evening`, `reminder`, `deadline`) | `{}` |

Creating uses `PUT` with a client-generated id, so a retry after a timeout overwrites instead of duplicating.
Completing an already completed task is a no-op that returns `{ "nextId": null }` (idempotent).
