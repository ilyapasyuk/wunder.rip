import Foundation

// Types for the planning fields of a task. Spec: shared/DATA_MODEL.md.
// Each type parses its raw database form once (failable init) and can't hold an invalid value afterwards.

/// Local calendar date, no time zone ("2026-11-16").
struct Day: Hashable, Comparable, Codable, CustomStringConvertible {
    let year: Int, month: Int, day: Int

    /// Gregorian calendar fixed to UTC, used only for date arithmetic so DST never shifts a day.
    private static let calendar: Calendar = {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC")!
        return calendar
    }()

    init?(_ string: String) {
        let parts = string.split(separator: "-", omittingEmptySubsequences: false)
        guard parts.count == 3, parts[0].count == 4, parts[1].count == 2, parts[2].count == 2,
              let y = Int(parts[0]), let m = Int(parts[1]), let d = Int(parts[2]),
              let date = Self.calendar.date(from: DateComponents(year: y, month: m, day: d)),
              Self.calendar.dateComponents([.year, .month, .day], from: date) == DateComponents(year: y, month: m, day: d)
        else { return nil }
        year = y; month = m; day = d
    }

    /// The local day of `date` in `calendar` (the user's calendar by default).
    init(_ date: Date, in calendar: Calendar = .current) {
        let c = calendar.dateComponents([.year, .month, .day], from: date)
        year = c.year!; month = c.month!; day = c.day!
    }

    static func today(in calendar: Calendar = .current) -> Day { Day(.now, in: calendar) }

    var string: String { String(format: "%04d-%02d-%02d", year, month, day) }
    var description: String { string }

    private var utcDate: Date { Self.calendar.date(from: DateComponents(year: year, month: month, day: day))! }

    /// Start of this day in the user's calendar, for display and notifications.
    func date(in calendar: Calendar = .current) -> Date {
        calendar.date(from: DateComponents(year: year, month: month, day: day))!
    }

    func adding(_ value: Int, _ component: Calendar.Component) -> Day {
        Day(Self.calendar.date(byAdding: component, value: value, to: utcDate)!, in: Self.calendar)
    }

    func days(to other: Day) -> Int {
        Self.calendar.dateComponents([.day], from: utcDate, to: other.utcDate).day!
    }

    static func < (lhs: Day, rhs: Day) -> Bool { lhs.string < rhs.string }

    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        guard let day = Day(raw) else {
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Bad day \(raw)"))
        }
        self = day
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(string)
    }
}

/// Wall-clock time "HH:mm" (24h, two digits each).
struct TimeOfDay: Hashable, Codable, CustomStringConvertible {
    let hour: Int, minute: Int

    init?(_ string: String) {
        let parts = string.split(separator: ":", omittingEmptySubsequences: false)
        guard parts.count == 2, parts[0].count == 2, parts[1].count == 2,
              let h = Int(parts[0]), let m = Int(parts[1]), (0 ..< 24).contains(h), (0 ..< 60).contains(m)
        else { return nil }
        hour = h; minute = m
    }

    init?(hour: Int, minute: Int) {
        self.init(String(format: "%02d:%02d", hour, minute))
    }

    var string: String { String(format: "%02d:%02d", hour, minute) }
    var description: String { string }

    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        guard let time = TimeOfDay(raw) else {
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Bad time \(raw)"))
        }
        self = time
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(string)
    }
}

/// When you plan to do a task. Evening and reminder only exist together with a day.
enum When: Hashable, Codable {
    case anytime
    case someday
    case day(Day, evening: Bool, reminder: TimeOfDay?)

    var day: Day? {
        if case let .day(day, _, _) = self { return day }
        return nil
    }

    var isEvening: Bool {
        if case let .day(_, evening, _) = self { return evening }
        return false
    }

    var reminder: TimeOfDay? {
        if case let .day(_, _, reminder) = self { return reminder }
        return nil
    }

    /// Moves a dated plan to another day, keeping evening and reminder.
    func moved(to newDay: Day) -> When {
        .day(newDay, evening: isEvening, reminder: reminder)
    }
}

struct RepeatRule: Hashable, Codable {
    enum Unit: String, Codable, CaseIterable { case day, week, month, year }
    enum From: String, Codable, CaseIterable { case schedule, completion }

    var unit: Unit
    var every: Int
    var from: From

    init(unit: Unit, every: Int = 1, from: From = .schedule) {
        self.unit = unit
        self.every = max(1, every)
        self.from = from
    }

    init?(dictionary dict: [String: Any]?) {
        guard let dict, let unit = (dict["unit"] as? String).flatMap(Unit.init(rawValue:)) else { return nil }
        self.init(
            unit: unit,
            every: (dict["every"] as? NSNumber)?.intValue ?? 1,
            from: (dict["from"] as? String).flatMap(From.init(rawValue:)) ?? .schedule
        )
    }

    var dictionary: [String: Any] { ["unit": unit.rawValue, "every": every, "from": from.rawValue] }

    func advance(_ day: Day) -> Day {
        switch unit {
        case .day: day.adding(every, .day)
        case .week: day.adding(every * 7, .day)
        case .month: day.adding(every, .month)
        case .year: day.adding(every, .year)
        }
    }
}

struct ChecklistItem: Identifiable, Hashable, Codable {
    var id: String
    var title: String
    var done: Bool

    init(id: String = UUID().uuidString, title: String, done: Bool = false) {
        self.id = id
        self.title = title
        self.done = done
    }

    init?(dictionary dict: [String: Any]) {
        guard let id = dict["id"] as? String, let title = dict["title"] as? String else { return nil }
        self.init(id: id, title: title, done: dict["done"] as? Bool ?? false)
    }

    var dictionary: [String: Any] { ["id": id, "title": title, "done": done] }
}

/// Computed views across all lists.
enum SmartList: String, CaseIterable, Codable {
    case today, upcoming, anytime, someday, logbook
}
