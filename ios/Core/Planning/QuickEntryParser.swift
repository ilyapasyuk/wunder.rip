import Foundation

/// What the compose bar understood from a typed line.
struct QuickEntry: Equatable {
    /// The text with every recognized phrase removed.
    var title: String
    /// `nil` when the text didn't say; the destination's default applies then.
    var when: When?
    var deadline: Day?
    var tags: [String]

    var recognizedAnything: Bool { when != nil || deadline != nil || !tags.isEmpty }

    /// Plan and list of the new task: what was typed wins over the destination's default.
    func plan(in destination: Destination, today: Day) -> (when: When, folderId: String?) {
        let defaults = destination.newTaskDefaults(today: today)
        return (when ?? defaults.when, defaults.folderId)
    }
}

/// Natural-language quick entry in English and Russian:
/// "Call mom tomorrow at 9 #family", "Отчёт до пятницы", "Gym next monday", "Налоги 21 ноября".
/// The first phrase of each kind wins; later ones stay in the title.
enum QuickEntryParser {
    static func parse(_ text: String, today: Day, locale: Locale = .current) -> QuickEntry {
        let raw = text.split(whereSeparator: \.isWhitespace).map(String.init)
        var scan = Scan(words: raw.map(normalize), today: today, monthFirst: locale.region?.identifier == "US")
        var used = Set<Int>()
        var day: Day?, evening = false, time: TimeOfDay?, someday = false, deadline: Day?, tags: [String] = []

        var i = 0
        while i < raw.count {
            let word = scan.words[i]
            var take = 0

            if word.hasPrefix("#"), word.count > 1 {
                let tag = Todo.cleanTag(String(raw[i].trimmingCharacters(in: trailingPunctuation)))
                if !tags.contains(where: { $0.caseInsensitiveCompare(tag) == .orderedSame }) { tags.append(tag) }
                take = 1
            } else if deadline == nil, let (due, n) = scan.deadline(at: i) {
                deadline = due
                take = n
            } else if !someday, day == nil, ["someday", "когда-нибудь", "когда-то"].contains(word) {
                someday = true
                take = 1
            } else if !someday, day == nil, word == "tonight" {
                day = today; evening = true; take = 1
            } else if !someday, day == nil, word == "this", scan.word(i + 1) == "evening" {
                day = today; evening = true; take = 2
            } else if word == "вечером" {
                evening = true; take = 1
            } else if time == nil, let (at, n) = scan.time(at: i) {
                time = at
                take = n
            } else if !someday, day == nil, let (found, n) = scan.day(at: i) {
                day = found
                take = n
                if ["evening", "вечером"].contains(scan.word(i + n)) {
                    evening = true
                    take += 1
                }
            }

            if take > 0 {
                for k in i ..< i + take { used.insert(k) }
                i += take
            } else {
                i += 1
            }
        }

        let title = raw.indices.filter { !used.contains($0) }.map { raw[$0] }.joined(separator: " ")
        guard !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            // Only a date was typed ("tomorrow"): it is the title, not a plan.
            return QuickEntry(title: text.trimmingCharacters(in: .whitespacesAndNewlines), when: nil, deadline: nil, tags: [])
        }

        let when: When? = if someday {
            .someday
        } else if day != nil || evening || time != nil {
            .day(day ?? today, evening: evening, reminder: time)
        } else {
            nil
        }
        return QuickEntry(title: title, when: when, deadline: deadline, tags: tags)
    }

    private static let trailingPunctuation = CharacterSet(charactersIn: ",;:!?")

    private static func normalize(_ word: String) -> String {
        var w = word.lowercased()
        while let last = w.last, ",;:?".contains(last) || (last == "!" && w.count > 1) { w.removeLast() }
        if w.hasSuffix("."), w.dropLast().allSatisfy({ $0.isNumber || $0 == "." }) { w.removeLast() }
        return w.replacingOccurrences(of: "ё", with: "е")
    }
}

/// Phrase matchers over the normalized words. Each returns the value and how many words it used.
private struct Scan {
    var words: [String]
    let today: Day
    let monthFirst: Bool

    func word(_ i: Int) -> String? { words.indices.contains(i) ? words[i] : nil }

    // MARK: Deadline: "!21.11", "!fri", "by friday", "due tomorrow", "до пятницы"

    func deadline(at i: Int) -> (Day, Int)? {
        let w = words[i]
        if w.hasPrefix("!"), w.count > 1 {
            var copy = self
            copy.words[i] = String(w.dropFirst())
            return copy.day(at: i, allowShortWeekdays: true)
        }
        if ["by", "due", "до"].contains(w), let (d, n) = day(at: i + 1, allowShortWeekdays: true) {
            return (d, n + 1)
        }
        return nil
    }

    // MARK: Days

    func day(at i: Int, allowShortWeekdays: Bool = false) -> (Day, Int)? {
        guard let w = word(i) else { return nil }
        switch w {
        case "today", "сегодня": return (today, 1)
        case "tomorrow", "tmrw", "завтра": return (today.adding(1, .day), 1)
        case "послезавтра": return (today.adding(2, .day), 1)
        case "day" where word(i + 1) == "after" && word(i + 2) == "tomorrow": return (today.adding(2, .day), 3)
        default: break
        }
        if let weekday = Self.weekdays[w], allowShortWeekdays || !Self.ambiguousWeekdays.contains(w) {
            return (next(weekday), 1)
        }
        if ["next", "on", "this", "в", "во"].contains(w), let next = word(i + 1), let weekday = Self.weekdays[next] {
            return (self.next(weekday), 2)
        }
        if w == "on", let (d, n) = date(at: i + 1) { return (d, n + 1) }
        if let found = relative(at: i) { return found }
        return date(at: i)
    }

    /// "in 3 days", "in a week", "через 2 недели", "через неделю".
    private func relative(at i: Int) -> (Day, Int)? {
        guard let w = word(i), w == "in" || w == "через", let a = word(i + 1) else { return nil }
        if let unit = Self.units[a] { return (today.adding(unit.1, unit.0), 2) }
        let count = Int(a) ?? (["a", "an", "one"].contains(a) ? 1 : nil)
        guard let count, (1 ... 999).contains(count), let b = word(i + 2), let unit = Self.units[b] else { return nil }
        return (today.adding(count * unit.1, unit.0), 3)
    }

    /// "21.11", "21.11.2027", "21/11" (11/21 in the US), "nov 21", "21 nov", "21 ноября", "november 21st".
    private func date(at i: Int) -> (Day, Int)? {
        guard let w = word(i) else { return nil }
        for separator in [".", "/"] where w.contains(separator) {
            let parts = w.split(separator: Character(separator), omittingEmptySubsequences: false).map { Int($0) }
            guard (2 ... 3).contains(parts.count), parts.allSatisfy({ $0 != nil }) else { return nil }
            let a = parts[0]!, b = parts[1]!, year = parts.count == 3 ? parts[2]! : nil
            let dayFirst = separator == "." || !monthFirst
            if let d = make(day: dayFirst ? a : b, month: dayFirst ? b : a, year: year) { return (d, 1) }
            if separator == "/", let d = make(day: dayFirst ? b : a, month: dayFirst ? a : b, year: year) { return (d, 1) }
            return nil
        }
        if let number = Self.dayNumber(w), let next = word(i + 1), let month = Self.months[next],
           let d = make(day: number, month: month, year: nil) {
            return (d, 2)
        }
        if let month = Self.months[w], let next = word(i + 1), let number = Self.dayNumber(next),
           let d = make(day: number, month: month, year: nil) {
            return (d, 2)
        }
        return nil
    }

    /// A date without a year is the next time it comes round (today included).
    private func make(day: Int, month: Int, year: Int?) -> Day? {
        if let year {
            return Day(String(format: "%04d-%02d-%02d", year < 100 ? 2000 + year : year, month, day))
        }
        guard let thisYear = Day(String(format: "%04d-%02d-%02d", today.year, month, day)) else { return nil }
        return thisYear >= today ? thisYear : Day(String(format: "%04d-%02d-%02d", today.year + 1, month, day))
    }

    /// The first `weekday` (1 = Sunday) after today.
    private func next(_ weekday: Int) -> Day {
        let current = Self.utc.component(.weekday, from: today.date(in: Self.utc))
        let ahead = (weekday - current + 7) % 7
        return today.adding(ahead == 0 ? 7 : ahead, .day)
    }

    // MARK: Time: "at 9", "9am", "6:30 pm", "18:30", "в 9", "в 7 вечера"

    func time(at i: Int) -> (TimeOfDay, Int)? {
        guard let w = word(i) else { return nil }
        let prefixed = ["at", "@", "в", "во"].contains(w)
        let start = prefixed ? i + 1 : i
        guard let token = word(start), let clock = Self.clock(token) else { return nil }
        var used = start - i + 1
        var meridiem = clock.meridiem
        if meridiem == nil, let next = word(start + 1), Self.meridiems.contains(next) {
            meridiem = next
            used += 1
        }
        // Without "at"/"в" only an unmistakable time counts: "9am", "18:30", "9 pm", not a bare number.
        guard prefixed || clock.hasMinutes || meridiem != nil else { return nil }
        var hour = clock.hour
        switch meridiem {
        case "pm", "p", "вечера", "дня":
            guard (1 ... 12).contains(hour) else { return nil }
            if hour < 12 { hour += 12 }
        case "am", "a", "утра", "ночи":
            guard (1 ... 12).contains(hour) else { return nil }
            if hour == 12 { hour = 0 }
        default: break
        }
        guard let time = TimeOfDay(hour: hour, minute: clock.minute) else { return nil }
        return (time, used)
    }

    private static func clock(_ token: String) -> (hour: Int, minute: Int, hasMinutes: Bool, meridiem: String?)? {
        var digits = token
        var meridiem: String?
        for suffix in ["am", "pm", "a", "p"] where digits.hasSuffix(suffix) && digits.count > suffix.count {
            meridiem = suffix
            digits.removeLast(suffix.count)
            break
        }
        let parts = digits.split(separator: ":", omittingEmptySubsequences: false)
        guard (1 ... 2).contains(parts.count), parts.allSatisfy({ !$0.isEmpty && $0.allSatisfy(\.isASCII) && $0.allSatisfy(\.isNumber) }),
              parts[0].count <= 2, let hour = Int(parts[0]) else { return nil }
        if parts.count == 2 {
            guard parts[1].count == 2, let minute = Int(parts[1]) else { return nil }
            return (hour, minute, true, meridiem)
        }
        return (hour, 0, false, meridiem)
    }

    // MARK: Words

    private static let utc: Calendar = {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC")!
        return calendar
    }()

    private static let meridiems: Set<String> = ["am", "pm", "a.m.", "p.m.", "утра", "вечера", "дня", "ночи"]

    /// English words that are also ordinary words; they mean a weekday only after "on"/"next"/"by"/"!".
    private static let ambiguousWeekdays: Set<String> = ["sat", "sun", "wed"]

    private static let weekdays: [String: Int] = {
        let names: [Int: [String]] = [
            1: ["sunday", "sun", "вс", "воскресенье", "воскресенья"],
            2: ["monday", "mon", "пн", "понедельник", "понедельника"],
            3: ["tuesday", "tue", "tues", "вт", "вторник", "вторника"],
            4: ["wednesday", "wed", "ср", "среда", "среду", "среды"],
            5: ["thursday", "thu", "thur", "thurs", "чт", "четверг", "четверга"],
            6: ["friday", "fri", "пт", "пятница", "пятницу", "пятницы"],
            7: ["saturday", "sat", "сб", "суббота", "субботу", "субботы"],
        ]
        return Dictionary(uniqueKeysWithValues: names.flatMap { number, words in words.map { ($0, number) } })
    }()

    private static let months: [String: Int] = {
        let names: [[String]] = [
            ["jan", "january", "янв", "января", "январь"],
            ["feb", "february", "фев", "февраля", "февраль"],
            ["mar", "march", "мар", "марта", "март"],
            ["apr", "april", "апр", "апреля", "апрель"],
            ["may", "мая", "май"],
            ["jun", "june", "июн", "июня", "июнь"],
            ["jul", "july", "июл", "июля", "июль"],
            ["aug", "august", "авг", "августа", "август"],
            ["sep", "sept", "september", "сен", "сент", "сентября", "сентябрь"],
            ["oct", "october", "окт", "октября", "октябрь"],
            ["nov", "november", "ноя", "нояб", "ноября", "ноябрь"],
            ["dec", "december", "дек", "декабря", "декабрь"],
        ]
        return Dictionary(uniqueKeysWithValues: names.enumerated().flatMap { index, words in words.map { ($0, index + 1) } })
    }()

    /// Words for a unit of time, as (calendar component, multiplier).
    private static let units: [String: (Calendar.Component, Int)] = {
        var map: [String: (Calendar.Component, Int)] = [:]
        for w in ["day", "days", "день", "дня", "дней"] { map[w] = (.day, 1) }
        for w in ["week", "weeks", "неделю", "недели", "недель"] { map[w] = (.day, 7) }
        for w in ["month", "months", "месяц", "месяца", "месяцев"] { map[w] = (.month, 1) }
        for w in ["year", "years", "год", "года", "лет"] { map[w] = (.year, 1) }
        return map
    }()

    /// "21", "21st", "3rd", "21-го".
    private static func dayNumber(_ word: String) -> Int? {
        var w = word
        for suffix in ["st", "nd", "rd", "th", "-го", "-e"] where w.hasSuffix(suffix) {
            w.removeLast(suffix.count)
            break
        }
        guard w.count <= 2, let n = Int(w), (1 ... 31).contains(n) else { return nil }
        return n
    }
}
