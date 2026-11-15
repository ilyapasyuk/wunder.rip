import Foundation

/// Smart lists and completion rules (shared/DATA_MODEL.md). Pure functions of the task and "today".
extension Todo {
    struct Placement: Equatable {
        var list: SmartList
        var evening: Bool
    }

    func placement(today: Day) -> Placement {
        if done { return Placement(list: .logbook, evening: false) }
        if let day = when.day, day <= today { return Placement(list: .today, evening: when.isEvening) }
        if let deadline, deadline <= today { return Placement(list: .today, evening: false) }
        if when.day != nil { return Placement(list: .upcoming, evening: false) }
        if when == .someday { return Placement(list: .someday, evening: false) }
        return Placement(list: .anytime, evening: false)
    }

    func isOverdue(today: Day) -> Bool {
        !done && (deadline.map { $0 < today } ?? false)
    }

    /// Marks the task done. A repeating task hands its rule to a new task (`next`) planned for the next day in the series.
    func complete(today: Day, now: Double, nextId: String) -> (completed: Todo, next: Todo?) {
        var completed = self
        completed.done = true
        completed.completedAt = now
        guard let rule = repeatRule else { return (completed, nil) }
        completed.repeatRule = nil

        let nextDay: Day
        switch rule.from {
        case .completion:
            nextDay = rule.advance(today)
        case .schedule:
            var day = rule.advance(when.day ?? today)
            while day <= today { day = rule.advance(day) }
            nextDay = day
        }

        var next = self
        next.id = nextId
        next.done = false
        next.completedAt = nil
        next.checklist = checklist.map { ChecklistItem(id: $0.id, title: $0.title, done: false) }
        next.when = when.day == nil ? .day(nextDay, evening: false, reminder: nil) : when.moved(to: nextDay)
        if let deadline {
            next.deadline = deadline.adding((when.day ?? today).days(to: nextDay), .day)
        }
        return (completed, next)
    }

    func reopened() -> Todo {
        var task = self
        task.done = false
        task.completedAt = nil
        return task
    }
}
