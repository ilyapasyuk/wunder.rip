import SwiftUI

// How Core's planning values look: localized words, SF Symbols and colors.

extension SmartList {
    var title: String {
        switch self {
        case .today: String(localized: "Today")
        case .upcoming: String(localized: "Upcoming")
        case .anytime: String(localized: "No Date")
        case .someday: String(localized: "Someday")
        case .logbook: String(localized: "Completed")
        }
    }

    var symbol: String {
        switch self {
        case .today: "sun.max.fill"
        case .upcoming: "calendar"
        case .anytime: "infinity"
        case .someday: "hourglass"
        case .logbook: "checkmark.seal.fill"
        }
    }

    /// One brand color for every smart list (our own look, not a per-list palette).
    var color: Color { .brand }
}

extension Color {
    static let todayYellow = Color.brand
    static let eveningBlue = Color(red: 0.55, green: 0.42, blue: 0.85)
}

extension Destination {
    var symbol: String {
        switch self {
        case let .smart(list): list.symbol
        case .inbox: "tray.fill"
        case .list: "list.bullet.circle"
        }
    }

    var color: Color {
        switch self {
        case let .smart(list): list.color
        case .inbox: .brand
        case .list: .accentColor
        }
    }
}

extension RelativeDay {
    /// "Today", "Tomorrow", "Friday", "21 Nov" (with the year when it isn't this year).
    func text(today: Day) -> String {
        switch self {
        case .today: String(localized: "Today")
        case .tomorrow: String(localized: "Tomorrow")
        case let .weekday(day): Self.capitalizedFirst(day.date().formatted(.dateTime.weekday(.wide)))
        case let .date(day):
            day.year == today.year
                ? day.date().formatted(.dateTime.day().month(.abbreviated))
                : day.date().formatted(.dateTime.day().month(.abbreviated).year())
        }
    }

    /// Russian weekdays come lowercase ("пятница"); standing alone they read better capitalized.
    private static func capitalizedFirst(_ text: String) -> String {
        text.prefix(1).uppercased() + text.dropFirst()
    }

    /// Longer form for section headers: "Tomorrow", "Friday", "Mon, 23 Nov".
    func header(today: Day) -> String {
        if case let .date(day) = self {
            return day.year == today.year
                ? day.date().formatted(.dateTime.weekday(.abbreviated).day().month(.abbreviated))
                : day.date().formatted(.dateTime.weekday(.abbreviated).day().month(.abbreviated).year())
        }
        return text(today: today)
    }
}

extension TimeOfDay {
    var date: Date { Calendar.current.date(from: DateComponents(hour: hour, minute: minute)) ?? .now }
    var text: String { date.formatted(date: .omitted, time: .shortened) }

    init(_ date: Date) {
        let c = Calendar.current.dateComponents([.hour, .minute], from: date)
        self = TimeOfDay(hour: c.hour ?? 0, minute: c.minute ?? 0)!
    }
}

extension QuickWhen {
    var title: String {
        switch self {
        case .today: String(localized: "Today")
        case .evening: String(localized: "This Evening")
        case .tomorrow: String(localized: "Tomorrow")
        case .someday: String(localized: "Someday")
        case .anytime: String(localized: "Clear")
        }
    }

    var symbol: String {
        switch self {
        case .today: "star.fill"
        case .evening: "sunset.fill"
        case .tomorrow: "sunrise.fill"
        case .someday: "archivebox.fill"
        case .anytime: "xmark.circle"
        }
    }
}

extension When {
    /// Short description for the editor and the compose preview: "Today", "This Evening", "Friday", "Someday".
    func label(today: Day) -> String {
        switch self {
        case .anytime: return String(localized: "Anytime")
        case .someday: return String(localized: "Someday")
        case let .day(day, evening, _):
            if day <= today { return evening ? String(localized: "This Evening") : String(localized: "Today") }
            let text = RelativeDay(day, today: today).text(today: today)
            return evening ? String(localized: "\(text) evening") : text
        }
    }

    func symbol(today: Day) -> String {
        switch self {
        case .anytime: "square.stack.3d.up"
        case .someday: "archivebox.fill"
        case let .day(day, evening, _): evening ? "sunset.fill" : (day <= today ? "sun.max.fill" : "calendar")
        }
    }

    func color(today: Day) -> Color {
        switch self {
        case .anytime: SmartList.anytime.color
        case .someday: SmartList.someday.color
        case let .day(day, evening, _): evening ? .eveningBlue : (day <= today ? .todayYellow : SmartList.upcoming.color)
        }
    }
}
