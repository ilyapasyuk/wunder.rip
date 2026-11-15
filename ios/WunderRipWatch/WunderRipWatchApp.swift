import SwiftUI

@main
struct WunderRipWatchApp: App {
    @StateObject private var store = WatchStore()

    var body: some Scene {
        WindowGroup {
            NavigationStack {
                TodayView()
            }
            .environmentObject(store)
        }
    }
}

struct TodayView: View {
    @EnvironmentObject private var store: WatchStore
    @State private var newTitle = ""

    var body: some View {
        let today = store.today()
        List {
            if !store.isSignedIn {
                Text("Open wunder.rip on your iPhone to sign in.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            } else {
                TextField("New task", text: $newTitle)
                    .onSubmit {
                        store.add(newTitle)
                        newTitle = ""
                    }
                if today.main.isEmpty, today.evening.isEmpty {
                    Text("Nothing for today")
                        .foregroundStyle(.secondary)
                }
                ForEach(today.main) { WatchTaskRow(todo: $0) }
                if !today.evening.isEmpty {
                    Section("This Evening") {
                        ForEach(today.evening) { WatchTaskRow(todo: $0) }
                    }
                }
                NavigationLink {
                    InboxView()
                } label: {
                    HStack {
                        Label("Inbox", systemImage: "tray")
                        Spacer()
                        if !store.inbox.isEmpty {
                            Text("\(store.inbox.count)").foregroundStyle(.secondary)
                        }
                    }
                }
            }
            if let error = store.errorMessage {
                Text(error).font(.footnote).foregroundStyle(.red)
            }
        }
        .navigationTitle("Today")
        .refreshable { await store.refresh() }
        .task { await store.refresh() }
    }
}

struct InboxView: View {
    @EnvironmentObject private var store: WatchStore

    var body: some View {
        List(store.inbox) { WatchTaskRow(todo: $0) }
            .navigationTitle("Inbox")
    }
}

struct WatchTaskRow: View {
    @EnvironmentObject private var store: WatchStore
    let todo: Todo

    var body: some View {
        Button {
            store.complete(todo)
        } label: {
            HStack(alignment: .top) {
                Image(systemName: todo.done ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(todo.done ? Color.green : Color.secondary)
                VStack(alignment: .leading, spacing: 2) {
                    Text(todo.task)
                        .strikethrough(todo.done)
                    if let deadline = todo.deadline {
                        Label(deadline.date().formatted(.dateTime.day().month()), systemImage: "flag.fill")
                            .font(.caption2)
                            .foregroundStyle(todo.isOverdue(today: .today()) ? .red : .secondary)
                    }
                }
            }
        }
        .disabled(todo.done)
        .sensoryFeedback(.success, trigger: todo.done)
    }
}
