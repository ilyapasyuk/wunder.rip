import Foundation

/// What the main list shows: a smart list across all lists, the Inbox, or one user list.
enum Destination: Hashable, Codable {
    case smart(SmartList)
    case inbox
    case list(String)
}

/// A titled group of tasks in the main list.
struct TaskSection: Identifiable, Equatable {
    enum Kind: Hashable {
        /// The main, unheaded group.
        case tasks
        /// Today's "This Evening".
        case evening
        /// One day in Upcoming.
        case day(Day)
        /// Completed tasks at the bottom of the Inbox or a list.
        case done
    }

    var kind: Kind
    var todos: [Todo]
    var id: Kind { kind }
}

extension Destination {
    /// Sections to show for this destination, empty ones left out. Tasks keep their manual `order` inside a section.
    func sections(of todos: [Todo], today: Day, logbookLimit: Int = 100) -> [TaskSection] {
        let ordered = todos.sorted { $0.order < $1.order }
        let sections: [TaskSection]
        switch self {
        case .smart(.today):
            let placed = ordered.map { ($0, $0.placement(today: today)) }.filter { $0.1.list == .today }
            sections = [
                TaskSection(kind: .tasks, todos: placed.filter { !$0.1.evening }.map(\.0)),
                TaskSection(kind: .evening, todos: placed.filter { $0.1.evening }.map(\.0)),
            ]
        case .smart(.upcoming):
            let upcoming = ordered.filter { $0.placement(today: today).list == .upcoming }
            let byDay = Dictionary(grouping: upcoming) { $0.when.day! }
            sections = byDay.keys.sorted().map { TaskSection(kind: .day($0), todos: byDay[$0]!) }
        case .smart(.logbook):
            let done = todos.filter(\.done).sorted { ($0.completedAt ?? 0) > ($1.completedAt ?? 0) }
            sections = [TaskSection(kind: .tasks, todos: Array(done.prefix(logbookLimit)))]
        case let .smart(list):
            sections = [TaskSection(kind: .tasks, todos: ordered.filter { $0.placement(today: today).list == list })]
        case .inbox, .list:
            let mine = ordered.filter { $0.folderId == folderId }
            sections = [
                TaskSection(kind: .tasks, todos: mine.filter { !$0.done }),
                TaskSection(kind: .done, todos: mine.filter(\.done)),
            ]
        }
        return sections.filter { !$0.todos.isEmpty }
    }

    /// Number next to the destination in the sidebar; `nil` where none is shown.
    func badgeCount(of todos: [Todo], today: Day) -> Int? {
        switch self {
        case .smart(.today): todos.count { $0.placement(today: today).list == .today }
        case .smart: nil
        case .inbox, .list: todos.count { !$0.done && $0.folderId == folderId }
        }
    }

    /// Plan and list for a task created while this destination is shown.
    func newTaskDefaults(today: Day) -> (when: When, folderId: String?) {
        switch self {
        case .smart(.today): (.day(today, evening: false, reminder: nil), nil)
        case .smart(.upcoming): (.day(today.adding(1, .day), evening: false, reminder: nil), nil)
        case .smart(.someday): (.someday, nil)
        case .smart: (.anytime, nil)
        case .inbox, .list: (.anytime, folderId)
        }
    }

    /// False for a list that was deleted (here or on another device).
    func exists(in folders: [TodoFolder]) -> Bool {
        guard case let .list(id) = self else { return true }
        return folders.contains { $0.id == id }
    }

    /// The folder this destination stands for; `nil` for the Inbox and smart lists.
    var folderId: String? {
        if case let .list(id) = self { return id }
        return nil
    }
}
