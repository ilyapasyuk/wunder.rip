import SwiftUI

struct TaskRowView: View {
    let todo: Todo
    let today: Day
    let destination: Destination
    let onToggle: () -> Void

    /// Shows the check right away; the task leaves the list a moment later so you see what you completed.
    @State private var checking = false

    private var showsDone: Bool { todo.done || checking }

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 12) {
            Button(action: toggle) {
                Image(systemName: showsDone ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(showsDone ? AnyShapeStyle(.green) : AnyShapeStyle(.tertiary))
                    .contentTransition(.symbolEffect(.replace))
            }
            .buttonStyle(.plain)
            .accessibilityLabel(showsDone ? Text("Mark as not done") : Text("Complete"))
            .sensoryFeedback(.success, trigger: checking) { _, new in new }

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    whenBadge
                    Text(todo.task)
                        .strikethrough(todo.done)
                        .foregroundStyle(todo.done ? .secondary : .primary)
                        .lineLimit(3)
                }
                details
            }
            Spacer(minLength: 0)
        }
        .contentShape(Rectangle())
        .onChange(of: todo.done) { _, _ in checking = false }
    }

    private func toggle() {
        guard !todo.done else {
            onToggle()
            return
        }
        withAnimation(.snappy) { checking = true }
        Task {
            try? await Task.sleep(for: .milliseconds(450))
            withAnimation(.snappy) { onToggle() }
        }
    }

    @ViewBuilder
    private var whenBadge: some View {
        switch todo.whenBadge(today: today, in: destination) {
        case .today:
            Image(systemName: "star.fill").foregroundStyle(Color.todayYellow).font(.caption)
        case .evening:
            Image(systemName: "sunset.fill").foregroundStyle(Color.eveningBlue).font(.caption)
        case .someday:
            Image(systemName: "archivebox.fill").foregroundStyle(SmartList.someday.color).font(.caption)
        case let .day(day):
            Text(day.text(today: today))
                .font(.caption.weight(.semibold))
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(.quaternary, in: Capsule())
        case nil:
            EmptyView()
        }
    }

    private var hasDetails: Bool {
        todo.deadlineBadge(today: today) != nil || todo.checklistProgress != nil || !todo.tags.isEmpty
            || todo.repeatRule != nil || !todo.note.isEmpty || !todo.files.isEmpty || todo.when.reminder != nil
    }

    @ViewBuilder
    private var details: some View {
        if hasDetails {
            HStack(spacing: 8) {
                if let reminder = todo.when.reminder, !todo.done {
                    Label(reminder.text, systemImage: "bell.fill")
                }
                if let deadline = todo.deadlineBadge(today: today) {
                    Label(deadline.day.text(today: today), systemImage: "flag.fill")
                        .foregroundStyle(deadline.overdue ? Color.red : deadline.day == .today ? Color.orange : Color.secondary)
                }
                if let progress = todo.checklistProgress {
                    Label("\(progress.done)/\(progress.total)", systemImage: "checklist")
                }
                if todo.repeatRule != nil {
                    Image(systemName: "repeat").accessibilityLabel(Text("Repeats"))
                }
                if !todo.note.isEmpty {
                    Image(systemName: "note.text").accessibilityLabel(Text("Note"))
                }
                if !todo.files.isEmpty {
                    Image(systemName: "photo").accessibilityLabel(Text("Photo"))
                }
                ForEach(todo.tags.prefix(3), id: \.self) { tag in
                    Text(tag)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 1)
                        .background(Color.secondary.opacity(0.15), in: Capsule())
                }
            }
            .labelStyle(CompactLabelStyle())
            .font(.caption)
            .foregroundStyle(.secondary)
            .lineLimit(1)
        }
    }
}

/// Icon and text closer together than the default label.
struct CompactLabelStyle: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: 3) {
            configuration.icon
            configuration.title
        }
    }
}
