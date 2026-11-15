import XCTest

final class QuickEntryParserTests: XCTestCase {
    /// Sunday.
    private let today = day("2026-11-15")

    private struct Case {
        var input: String
        var title: String
        var when: When? = nil
        var deadline: String? = nil
        var tags: [String] = []
        var locale = "en_GB"
        var line: UInt = #line
    }

    private let cases: [Case] = [
        // Nothing to recognize
        Case(input: "Buy milk", title: "Buy milk"),
        Case(input: "Read 2 books", title: "Read 2 books"),
        Case(input: "Buy sun cream", title: "Buy sun cream"),
        Case(input: "Купить 5 яблок", title: "Купить 5 яблок"),
        Case(input: "tomorrow", title: "tomorrow"),

        // English days
        Case(input: "Buy milk today", title: "Buy milk", when: on("2026-11-15")),
        Case(input: "Call mom tomorrow", title: "Call mom", when: on("2026-11-16")),
        Case(input: "Call mom tonight", title: "Call mom", when: on("2026-11-15", evening: true)),
        Case(input: "Read this evening", title: "Read", when: on("2026-11-15", evening: true)),
        Case(input: "Call tomorrow evening", title: "Call", when: on("2026-11-16", evening: true)),
        Case(input: "Report day after tomorrow", title: "Report", when: on("2026-11-17")),
        Case(input: "Gym monday", title: "Gym", when: on("2026-11-16")),
        Case(input: "Gym Monday,", title: "Gym", when: on("2026-11-16")),
        Case(input: "Gym next monday", title: "Gym", when: on("2026-11-16")),
        Case(input: "Dentist on friday", title: "Dentist", when: on("2026-11-20")),
        Case(input: "Dentist fri", title: "Dentist", when: on("2026-11-20")),
        Case(input: "Plan sunday", title: "Plan", when: on("2026-11-22")),
        Case(input: "Pay rent in 3 days", title: "Pay rent", when: on("2026-11-18")),
        Case(input: "Trip in 2 weeks", title: "Trip", when: on("2026-11-29")),
        Case(input: "Taxes 21.11", title: "Taxes", when: on("2026-11-21")),
        Case(input: "Taxes 21/11", title: "Taxes", when: on("2026-11-21")),
        Case(input: "Taxes 11/21", title: "Taxes", when: on("2026-11-21"), locale: "en_US"),
        Case(input: "Party nov 21", title: "Party", when: on("2026-11-21")),
        Case(input: "Party 3 january", title: "Party", when: on("2027-01-03")),
        Case(input: "Renew 10.11", title: "Renew", when: on("2027-11-10")),
        Case(input: "Learn guitar someday", title: "Learn guitar", when: .someday),

        // English times
        Case(input: "Call at 9", title: "Call", when: on("2026-11-15", at: "09:00")),
        Case(input: "Call tomorrow 9am", title: "Call", when: on("2026-11-16", at: "09:00")),
        Case(input: "Call tomorrow at 6:30pm", title: "Call", when: on("2026-11-16", at: "18:30")),
        Case(input: "Meeting friday 18:30", title: "Meeting", when: on("2026-11-20", at: "18:30")),
        Case(input: "Pay in 3 days at 8 pm", title: "Pay", when: on("2026-11-18", at: "20:00")),
        Case(input: "Read someday at 9", title: "Read", when: .someday),

        // Tags and deadlines
        Case(input: "Email boss #work #urgent", title: "Email boss", tags: ["work", "urgent"]),
        Case(input: "Someday #ideas write a book", title: "write a book", when: .someday, tags: ["ideas"]),
        Case(input: "Submit report !21.11", title: "Submit report", deadline: "2026-11-21"),
        Case(input: "Submit report by friday", title: "Submit report", deadline: "2026-11-20"),
        Case(input: "Report due tomorrow", title: "Report", deadline: "2026-11-16"),
        Case(input: "Slides tomorrow !fri", title: "Slides", when: on("2026-11-16"), deadline: "2026-11-20"),

        // Russian
        Case(input: "Купить молоко сегодня", title: "Купить молоко", when: on("2026-11-15")),
        Case(input: "Позвонить маме завтра", title: "Позвонить маме", when: on("2026-11-16")),
        Case(input: "Отчёт послезавтра", title: "Отчёт", when: on("2026-11-17")),
        Case(input: "Почитать вечером", title: "Почитать", when: on("2026-11-15", evening: true)),
        Case(input: "Почитать сегодня вечером", title: "Почитать", when: on("2026-11-15", evening: true)),
        Case(input: "Спортзал в понедельник", title: "Спортзал", when: on("2026-11-16")),
        Case(input: "Спортзал в пятницу", title: "Спортзал", when: on("2026-11-20")),
        Case(input: "Спортзал пт", title: "Спортзал", when: on("2026-11-20")),
        Case(input: "Оплатить через 3 дня", title: "Оплатить", when: on("2026-11-18")),
        Case(input: "Оплатить через неделю", title: "Оплатить", when: on("2026-11-22")),
        Case(input: "Налоги 21 ноября", title: "Налоги", when: on("2026-11-21")),
        Case(input: "Созвон в 9", title: "Созвон", when: on("2026-11-15", at: "09:00")),
        Case(input: "Созвон завтра в 18:30", title: "Созвон", when: on("2026-11-16", at: "18:30")),
        Case(input: "Встреча в 7 вечера", title: "Встреча", when: on("2026-11-15", at: "19:00")),
        Case(input: "Встреча 21.11 в 15:00", title: "Встреча", when: on("2026-11-21", at: "15:00")),
        Case(input: "в субботу в 10 убрать квартиру", title: "убрать квартиру", when: on("2026-11-21", at: "10:00")),
        Case(input: "Выучить испанский когда-нибудь", title: "Выучить испанский", when: .someday),
        Case(input: "Отчёт до 21.11", title: "Отчёт", deadline: "2026-11-21"),
        Case(input: "Отчёт до пятницы", title: "Отчёт", deadline: "2026-11-20"),
        Case(input: "Купить подарок #дом", title: "Купить подарок", tags: ["дом"]),
        Case(input: "Позвонить завтра вечером #семья !20.11", title: "Позвонить", when: on("2026-11-16", evening: true), deadline: "2026-11-20", tags: ["семья"]),
    ]

    func testTable() {
        XCTAssertGreaterThanOrEqual(cases.count, 30)
        for c in cases {
            let entry = QuickEntryParser.parse(c.input, today: today, locale: Locale(identifier: c.locale))
            XCTAssertEqual(entry.title, c.title, "title of \"\(c.input)\"", line: c.line)
            XCTAssertEqual(entry.when, c.when, "when of \"\(c.input)\"", line: c.line)
            XCTAssertEqual(entry.deadline, c.deadline.map(day), "deadline of \"\(c.input)\"", line: c.line)
            XCTAssertEqual(entry.tags, c.tags, "tags of \"\(c.input)\"", line: c.line)
        }
    }

    func testRecognizedPlanWinsOverTheViewDefault() {
        let tomorrow = QuickEntryParser.parse("Call tomorrow", today: today, locale: Locale(identifier: "en"))
        XCTAssertEqual(tomorrow.plan(in: .smart(.someday), today: today).when, on("2026-11-16"))
        XCTAssertEqual(tomorrow.plan(in: .list("f"), today: today).folderId, "f")

        let plain = QuickEntryParser.parse("Call", today: today, locale: Locale(identifier: "en"))
        XCTAssertEqual(plain.plan(in: .smart(.today), today: today).when, on("2026-11-15"))
        XCTAssertFalse(plain.recognizedAnything)
        XCTAssertTrue(tomorrow.recognizedAnything)
    }
}
