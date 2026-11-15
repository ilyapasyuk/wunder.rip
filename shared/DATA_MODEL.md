# wunder.rip data model

One spec for every client: web (`src/`), MCP server (`worker/`) and iOS (`ios/Core`).
`model-vectors.json` holds the test cases each implementation must pass — change both together.

## Glossary
| Term | Meaning |
| --- | --- |
| **Task** | A to-do. Node `todos/{uid}/{taskId}`. |
| **List** | A user folder (`folders/{uid}/{id}`). A task with no list is in the **Inbox**. |
| **When** | The day you plan to do it: *Anytime* (none), *Someday*, or a **day**. Not a deadline. |
| **Day** | Local calendar date `YYYY-MM-DD`, no time zone. "Today" is the client's local date. |
| **Evening** | A dated task you plan for the evening part of that day ("This Evening"). |
| **Reminder** | Local wall-clock time `HH:mm` on the When day. Only exists with a day. |
| **Deadline** | Day it must be done by. Independent of When. |
| **Repeat** | Rule to create the next task when this one is completed. |
| **Checklist** | Sub-steps inside a task. |
| **Tag** | Free-text label, case-insensitive, stored as typed. |
| **Smart list** | Computed view across all lists: Today, Upcoming, Anytime, Someday, Logbook. |

## Task node
Existing fields stay as they are (`task`, `done`, `createdAt`, `note`, `files`, `order`, `isPublic`, `folderId`).
New fields are all optional; an old client simply ignores them.

| Field | Type | Rule |
| --- | --- | --- |
| `when` | `null` \| `"someday"` \| `"YYYY-MM-DD"` | missing/null/invalid = Anytime |
| `evening` | bool | only meaningful with a day; otherwise read as `false` |
| `reminder` | `"HH:mm"` \| null | only with a day; otherwise read as `null` |
| `deadline` | `"YYYY-MM-DD"` \| null | invalid = null |
| `repeat` | `{ unit: "day"\|"week"\|"month"\|"year", every: int ≥ 1, from: "schedule"\|"completion" }` \| null | unknown unit = no repeat; `every < 1` = 1; unknown `from` = `"schedule"` |
| `checklist` | `[{ id: string, title: string, done: bool }]` | missing = empty |
| `tags` | `string[]` | missing = empty |
| `completedAt` | ms since epoch \| null | set when `done` becomes true, cleared when undone |

Parse once where data comes in (database snapshot, MCP input) into the normalized shape; inside, trust it.

## Smart lists
For an **open** task (`done == false`) and `today`:
1. `when` is a day ≤ today, **or** `deadline` ≤ today → **Today** (in the *Evening* section if `evening`).
2. `when` is a day > today → **Upcoming**.
3. `when` is Someday → **Someday**.
4. otherwise → **Anytime**.

A done task → **Logbook** (newest `completedAt` first).
Lists (Inbox and folders) still show every task in them, as before.

## Completing a repeating task
`complete(task, today, now)`:
- the task becomes `done: true`, `completedAt: now`, and **loses** its `repeat` (the series moves on);
- a **next** task is created: same fields, `done: false`, `completedAt: null`, checklist unchecked, new id, same `repeat`, and
  - `from: "completion"` → `when = advance(today)`;
  - `from: "schedule"` → `when = advance(base)` repeated until it is after today, where `base` = the task's day, or today if it has none;
  - `deadline` (if any) moves by the same number of days as `when`; `evening` and `reminder` are kept.
- `advance` adds `every` units; months/years clamp to the last day of the month (Jan 31 + 1 month = Feb 28/29).

Completing a task without `repeat` just sets `done` and `completedAt`.

## Implementation notes
- **Web + MCP server:** the model is `shared/task-model.ts`, imported by `src/` and `worker/`; `shared/test/task-model.test.ts` runs every vector.
- Writes from the web app and the MCP server go one path per field, so fields a client does not know about survive. Completing a repeating task writes the completed task and the next one in one multi-path update.
- Completing a task that is already done is a no-op (no second `next`).
- `schedule` catch-up applies `advance` repeatedly to the previous result (so a month series that clamps to Feb 28 continues from the 28th).
- A task with no day that repeats: its `deadline` moves by the distance from today to the new `when`.
- The MCP server rejects a `reminder` or `evening: true` when the task would have no day, instead of silently dropping it.
