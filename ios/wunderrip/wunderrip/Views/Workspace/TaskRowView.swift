import SwiftUI

struct TaskRowView: View {
    let todo: Todo
    let onToggle: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Button(action: onToggle) {
                Image(systemName: todo.done ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(todo.done ? .green : .secondary)
                    .font(.title3)
            }
            .buttonStyle(.plain)

            Text(todo.task)
                .strikethrough(todo.done)
                .foregroundStyle(todo.done ? .secondary : .primary)

            Spacer()

            if !todo.note.isEmpty {
                Image(systemName: "note.text")
                    .foregroundStyle(.secondary)
                    .font(.caption)
            }
            if !todo.files.isEmpty {
                Image(systemName: "photo")
                    .foregroundStyle(.green)
                    .font(.caption)
            }
        }
        .contentShape(Rectangle())
    }
}
