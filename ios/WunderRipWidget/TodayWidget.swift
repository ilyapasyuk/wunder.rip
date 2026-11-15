import AppIntents
import SwiftUI
import WidgetKit

struct TodayEntry: TimelineEntry {
    var date: Date
    var signedIn: Bool
    var main: [Todo]
    var evening: [Todo]

    var count: Int { main.count + evening.count }

    static let preview = TodayEntry(date: .now, signedIn: true, main: [
        Todo(id: "1", task: String(localized: "Buy milk"), done: false, createdAt: 0, note: "", files: [], order: 0, isPublic: false, folderId: nil),
        Todo(id: "2", task: String(localized: "Call the dentist"), done: false, createdAt: 0, note: "", files: [], order: 1, isPublic: false, folderId: nil),
    ], evening: [
        Todo(id: "3", task: String(localized: "Read a chapter"), done: false, createdAt: 0, note: "", files: [], order: 2, isPublic: false, folderId: nil),
    ])
}

struct TodayProvider: TimelineProvider {
    func placeholder(in _: Context) -> TodayEntry { .preview }

    func getSnapshot(in context: Context, completion: @escaping (TodayEntry) -> Void) {
        completion(context.isPreview ? .preview : Self.entry(at: .now))
    }

    func getTimeline(in _: Context, completion: @escaping (Timeline<TodayEntry>) -> Void) {
        // Redraw at midnight: tomorrow's tasks move into Today.
        let midnight = Calendar.current.startOfDay(for: .now.addingTimeInterval(86400))
        completion(Timeline(entries: [Self.entry(at: .now)], policy: .after(midnight)))
    }

    static func entry(at date: Date) -> TodayEntry {
        guard let userId = AppConfig.signedInUserId, let snapshot = SnapshotStore.load(userId: userId) else {
            return TodayEntry(date: date, signedIn: false, main: [], evening: [])
        }
        let sections = Destination.smart(.today).sections(of: snapshot.todos, today: Day(date))
        return TodayEntry(date: date, signedIn: true,
                          main: sections.first { $0.kind == .tasks }?.todos ?? [],
                          evening: sections.first { $0.kind == .evening }?.todos ?? [])
    }
}

struct TodayWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: TodayEntry

    private var limit: Int { family == .systemLarge ? 9 : 4 }

    var body: some View {
        switch family {
        case .accessoryCircular:
            Gauge(value: 0) { Image(systemName: "star.fill") } currentValueLabel: { Text("\(entry.count)") }
                .gaugeStyle(.accessoryCircularCapacity)
        case .accessoryInline:
            Label(entry.count == 0 ? String(localized: "Nothing for today") : String(localized: "\(entry.count) for today"), systemImage: "star.fill")
        case .accessoryRectangular:
            VStack(alignment: .leading) {
                Label(String(localized: "Today"), systemImage: "star.fill").font(.headline)
                Text(entry.main.first?.task ?? entry.evening.first?.task ?? String(localized: "Nothing for today"))
                    .lineLimit(2)
            }
        case .systemSmall:
            VStack(alignment: .leading, spacing: 6) {
                header
                Spacer()
                Text("\(entry.count)").font(.system(size: 44, weight: .bold, design: .rounded))
                Text(entry.main.first?.task ?? entry.evening.first?.task ?? String(localized: "Nothing for today"))
                    .font(.caption).lineLimit(2).foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        default:
            VStack(alignment: .leading, spacing: 6) {
                header
                if !entry.signedIn {
                    Text("Open wunder.rip and sign in first.").font(.caption).foregroundStyle(.secondary)
                } else if entry.count == 0 {
                    Spacer()
                    Text("Nothing for today").foregroundStyle(.secondary)
                    Spacer()
                } else {
                    ForEach(entry.main.prefix(limit)) { row($0) }
                    let room = max(0, limit - entry.main.count)
                    if room > 0, !entry.evening.isEmpty {
                        Label(String(localized: "This Evening"), systemImage: "moon.fill")
                            .font(.caption2.bold()).foregroundStyle(.indigo)
                        ForEach(entry.evening.prefix(room)) { row($0) }
                    }
                    Spacer(minLength: 0)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var header: some View {
        HStack {
            Label(String(localized: "Today"), systemImage: "star.fill")
                .font(.headline).foregroundStyle(.yellow)
            Spacer()
            if family != .systemSmall, entry.count > 0 {
                Text("\(entry.count)").font(.headline).foregroundStyle(.secondary)
            }
        }
    }

    private func row(_ todo: Todo) -> some View {
        Button(intent: CompleteTaskIntent(taskId: todo.id)) {
            HStack(spacing: 8) {
                Image(systemName: todo.done ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(todo.done ? Color.green : Color.secondary)
                Text(todo.task).lineLimit(1).strikethrough(todo.done)
                Spacer(minLength: 0)
                if todo.deadline != nil {
                    Image(systemName: "flag.fill").font(.caption2)
                        .foregroundStyle(todo.isOverdue(today: Day(entry.date)) ? .red : .secondary)
                }
            }
            .font(.subheadline)
        }
        .buttonStyle(.plain)
    }
}

struct TodayWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "Today", provider: TodayProvider()) { entry in
            TodayWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
                .widgetURL(URL(string: "wunderrip://today"))
        }
        .configurationDisplayName("Today")
        .description("Tasks for today. Tap the circle to complete.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}

@main
struct WunderRipWidgets: WidgetBundle {
    var body: some Widget {
        TodayWidget()
    }
}
