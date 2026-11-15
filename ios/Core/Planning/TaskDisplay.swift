import Foundation

// What a task row and the editors show, as data. Views only turn these into text and symbols.

/// A day relative to today, the way a person says it: "Today", "Tomorrow", "Friday", "21 Nov".
enum RelativeDay: Hashable {
    case today, tomorrow
    /// 2–6 days ahead: the weekday name is unambiguous.
    case weekday(Day)
    /// Further out, or in the past.
    case date(Day)

    init(_ day: Day, today: Day) {
        switch today.days(to: day) {
        case 0: self = .today
        case 1: self = .tomorrow
        case 2 ... 6: self = .weekday(day)
        default: self = .date(day)
        }
    }
}

/// The plan shown on a row.
enum WhenBadge: Hashable {
    /// Star: planned for today (or earlier).
    case today
    /// Moon: planned for this evening.
    case evening
    case someday
    case day(RelativeDay)
}

struct DeadlineBadge: Hashable {
    var day: RelativeDay
    var overdue: Bool
}

struct ChecklistProgress: Hashable {
    var done: Int
    var total: Int
}

/// One-tap plans offered in swipe actions and the task editor.
enum QuickWhen: CaseIterable {
    case today, evening, tomorrow, someday
    /// Clears the plan.
    case anytime
}

extension Todo {
    /// The plan badge for this row, or `nil` when the destination already says it (Today in Today, a day header in Upcoming).
    func whenBadge(today: Day, in destination: Destination) -> WhenBadge? {
        guard !done else { return nil }
        switch when {
        case .anytime:
            return nil
        case .someday:
            switch destination {
            case .inbox, .list: return .someday
            case .smart: return nil
            }
        case let .day(day, evening, _):
            if day <= today {
                return destination == .smart(.today) ? nil : (evening ? .evening : .today)
            }
            return destination == .smart(.upcoming) ? nil : .day(RelativeDay(day, today: today))
        }
    }

    func deadlineBadge(today: Day) -> DeadlineBadge? {
        guard !done, let deadline else { return nil }
        return DeadlineBadge(day: RelativeDay(deadline, today: today), overdue: isOverdue(today: today))
    }

    var checklistProgress: ChecklistProgress? {
        checklist.isEmpty ? nil : ChecklistProgress(done: checklist.count(where: \.done), total: checklist.count)
    }

    /// Adds a tag as typed (without a leading "#"); a tag that differs only by case is not added twice.
    func addingTag(_ raw: String) -> Todo {
        let tag = Self.cleanTag(raw)
        guard !tag.isEmpty, !tags.contains(where: { $0.caseInsensitiveCompare(tag) == .orderedSame }) else { return self }
        var copy = self
        copy.tags.append(tag)
        return copy
    }

    func removingTag(_ tag: String) -> Todo {
        var copy = self
        copy.tags.removeAll { $0.caseInsensitiveCompare(tag) == .orderedSame }
        return copy
    }

    static func cleanTag(_ raw: String) -> String {
        var tag = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        while tag.hasPrefix("#") { tag.removeFirst() }
        return tag.trimmingCharacters(in: .whitespaces)
    }
}

extension When {
    /// Applies a one-tap plan; a reminder set before stays when the result is a day.
    func applying(_ quick: QuickWhen, today: Day) -> When {
        switch quick {
        case .today: .day(today, evening: false, reminder: reminder)
        case .evening: .day(today, evening: true, reminder: reminder)
        case .tomorrow: .day(today.adding(1, .day), evening: false, reminder: reminder)
        case .someday: .someday
        case .anytime: .anytime
        }
    }

    /// Sets or clears the reminder; a plan without a day can't have one and stays as it is.
    func withReminder(_ time: TimeOfDay?) -> When {
        guard case let .day(day, evening, _) = self else { return self }
        return .day(day, evening: evening, reminder: time)
    }

    func withEvening(_ evening: Bool) -> When {
        guard case let .day(day, _, reminder) = self else { return self }
        return .day(day, evening: evening, reminder: reminder)
    }

    /// Plans for `day`, keeping evening and reminder of a dated plan.
    func onDay(_ day: Day) -> When {
        self.day == nil ? .day(day, evening: false, reminder: nil) : moved(to: day)
    }
}

enum TagSuggestions {
    /// Tags used on any task that start with `prefix` (case-insensitive), most used first, minus the ones in `excluding`.
    static func suggestions(for prefix: String, in todos: [Todo], excluding: [String], limit: Int = 8) -> [String] {
        let prefix = Todo.cleanTag(prefix).lowercased()
        let excluded = Set(excluding.map { $0.lowercased() })
        var spelling: [String: String] = [:]
        var uses: [String: Int] = [:]
        for tag in todos.flatMap(\.tags) {
            let key = tag.lowercased()
            if spelling[key] == nil { spelling[key] = tag }
            uses[key, default: 0] += 1
        }
        return uses.keys
            .filter { $0.hasPrefix(prefix) && !excluded.contains($0) }
            .sorted { uses[$0]! != uses[$1]! ? uses[$0]! > uses[$1]! : $0 < $1 }
            .prefix(limit)
            .map { spelling[$0]! }
    }
}
