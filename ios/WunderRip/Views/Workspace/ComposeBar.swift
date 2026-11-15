import SwiftUI

/// Bottom bar for new tasks. Understands plans in the text ("tomorrow at 9 #work") and previews what it recognized.
struct ComposeBar: View {
    @EnvironmentObject private var appState: AppState
    @Binding var text: String
    @FocusState private var focused: Bool

    private var entry: QuickEntry { QuickEntryParser.parse(text, today: appState.today) }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if !text.isEmpty, entry.recognizedAnything {
                preview
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
            HStack(spacing: 10) {
                Image(systemName: "plus.circle.fill")
                    .font(.title2)
                    .foregroundStyle(.tint)
                TextField("New task...", text: $text)
                    .focused($focused)
                    .submitLabel(.done)
                    .onSubmit(add)
                if !text.isEmpty {
                    Button("Add", action: add)
                        .fontWeight(.semibold)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 20))
        }
        .animation(.snappy, value: entry.recognizedAnything)
        .padding(.horizontal, 12)
        .padding(.top, 8)
        .padding(.bottom, 4)
        .background(.bar)
    }

    private var preview: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                if let when = entry.when {
                    chip(when.label(today: appState.today) + (when.reminder.map { " " + $0.text } ?? ""),
                         symbol: when.symbol(today: appState.today), color: when.color(today: appState.today))
                }
                if let deadline = entry.deadline {
                    chip(RelativeDay(deadline, today: appState.today).text(today: appState.today), symbol: "flag.fill", color: .red)
                }
                ForEach(entry.tags, id: \.self) { tag in
                    chip(tag, symbol: "tag.fill", color: .gray)
                }
            }
            .padding(.horizontal, 4)
        }
        .accessibilityElement(children: .combine)
    }

    private func chip(_ title: String, symbol: String, color: Color) -> some View {
        Label(title, systemImage: symbol)
            .labelStyle(CompactLabelStyle())
            .font(.caption.weight(.semibold))
            .foregroundStyle(color)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(color.opacity(0.15), in: Capsule())
    }

    private func add() {
        let entry = self.entry
        guard !Todo.cleanTitle(entry.title).isEmpty else { return }
        appState.create(entry)
        text = ""
    }
}
