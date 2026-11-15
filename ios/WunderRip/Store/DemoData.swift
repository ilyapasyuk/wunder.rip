#if DEBUG
import Foundation

/// DEBUG-only sample data for the simulator, where you can't sign in.
///
/// `-demo 1` skips sign-in and fills every list and badge;
/// `-demoDestination today|upcoming|anytime|someday|logbook|inbox|work|sidebar` picks the list;
/// `-demoTask <id>` opens a task (e.g. `review`); `-demoCompose "<text>"` pre-types a new task.
enum DemoData {
    static var isRequested: Bool { UserDefaults.standard.bool(forKey: "demo") }

    @MainActor
    static func start(_ appState: AppState) {
        let defaults = UserDefaults.standard
        let (todos, folders) = make(today: .today(), now: .now, russian: Locale.preferredLanguages.first?.hasPrefix("ru") == true)
        appState.startDemo(todos: todos, folders: folders)
        // Widgets read the App Group snapshot: give them the demo tasks too (screenshots).
        AppConfig.signedInUserId = "demo"
        SnapshotStore.save(Snapshot(userId: "demo", todos: todos, folders: folders, savedAt: .now))
        switch defaults.string(forKey: "demoDestination") {
        case "upcoming": appState.destination = .smart(.upcoming)
        case "anytime": appState.destination = .smart(.anytime)
        case "someday": appState.destination = .smart(.someday)
        case "logbook": appState.destination = .smart(.logbook)
        case "inbox": appState.destination = .inbox
        case "work": appState.destination = .list("work")
        case "sidebar": appState.destination = nil
        default: appState.destination = .smart(.today)
        }
        appState.selectedTaskId = defaults.string(forKey: "demoTask")
    }

    static var composeText: String { UserDefaults.standard.string(forKey: "demoCompose") ?? "" }

    static func make(today: Day, now: Date, russian: Bool) -> ([Todo], [TodoFolder]) {
        func t(_ en: String, _ ru: String) -> String { russian ? ru : en }
        func plus(_ days: Int) -> Day { today.adding(days, .day) }
        let ms = now.millisecondsSince1970
        var order = 0.0

        func task(
            _ id: String, _ title: String, when: When = .anytime, deadline: Day? = nil, folder: String? = nil,
            note: String = "", tags: [String] = [], checklist: [(String, Bool)] = [], repeatRule: RepeatRule? = nil,
            files: [String] = [], doneAgo hours: Double? = nil
        ) -> Todo {
            order += 1
            return Todo(
                id: id, task: title, done: hours != nil, createdAt: ms, note: note, files: files, order: order,
                isPublic: false, folderId: folder, when: when, deadline: deadline, repeatRule: repeatRule,
                checklist: checklist.enumerated().map { ChecklistItem(id: "\(id)-\($0.offset)", title: $0.element.0, done: $0.element.1) },
                tags: tags, completedAt: hours.map { ms - $0 * 3_600_000 }
            )
        }

        let folders = [
            TodoFolder(id: "work", name: t("Work", "Работа"), createdAt: ms, order: 0),
            TodoFolder(id: "home", name: t("Home", "Дом"), createdAt: ms, order: 1),
            TodoFolder(id: "trip", name: t("Trip to Lisbon", "Поездка в Лиссабон"), createdAt: ms, order: 2),
        ]

        let todos = [
            // Today
            task("review", t("Review pull requests", "Посмотреть пулл-реквесты"),
                 when: .day(today, evening: false, reminder: TimeOfDay("10:00")), folder: "work",
                 note: t("Start with the sync fix.", "Начать с фикса синхронизации."), tags: [t("work", "работа")],
                 checklist: [(t("Sync fix", "Фикс синхронизации"), true), (t("Share extension", "Share-расширение"), true),
                             (t("Widgets", "Виджеты"), false), (t("Onboarding", "Онбординг"), false), (t("Settings", "Настройки"), false)]),
            task("expenses", t("Submit expense report", "Сдать авансовый отчёт"), when: .day(today, evening: false, reminder: nil),
                 deadline: plus(-1), folder: "work", tags: [t("work", "работа")]),
            task("bank", t("Call the bank", "Позвонить в банк"), when: .day(plus(-2), evening: false, reminder: nil)),
            task("bill", t("Pay electricity bill", "Оплатить электричество"), deadline: today, folder: "home", note: "Account 1234-5678"),
            task("plants", t("Water the plants", "Полить цветы"), when: .day(today, evening: false, reminder: nil), folder: "home",
                 repeatRule: RepeatRule(unit: .week)),
            task("read", t("Read 30 pages", "Прочитать 30 страниц"), when: .day(today, evening: true, reminder: nil),
                 repeatRule: RepeatRule(unit: .day, from: .completion)),
            task("weekend", t("Plan the weekend", "Спланировать выходные"), when: .day(today, evening: true, reminder: TimeOfDay("20:30")),
                 tags: [t("family", "семья")]),

            // Upcoming
            task("dentist", t("Dentist appointment", "Записаться к стоматологу"), when: .day(plus(1), evening: false, reminder: TimeOfDay("09:30"))),
            task("retro", t("Team retro", "Ретро команды"), when: .day(plus(2), evening: false, reminder: nil), folder: "work"),
            task("flights", t("Book flights", "Купить билеты"), when: .day(plus(3), evening: false, reminder: nil), folder: "trip",
                 files: ["demo-photo"]),
            task("gift", t("Buy birthday gift for Anna", "Купить подарок Ане"), when: .day(plus(4), evening: false, reminder: nil),
                 deadline: plus(5), tags: [t("family", "семья"), t("shopping", "покупки")]),
            task("passport", t("Renew passport", "Продлить паспорт"), when: .day(plus(12), evening: false, reminder: nil), folder: "trip"),

            // Anytime
            task("swiftui", t("Learn SwiftUI animations", "Разобраться с анимациями SwiftUI"), folder: "work"),
            task("bike", t("Fix the bike", "Починить велосипед"), folder: "home"),
            task("mike", t("Reply to Mike's email", "Ответить Мише на письмо"), note: t("About the conference", "Про конференцию")),

            // Someday
            task("portuguese", t("Learn Portuguese", "Выучить португальский"), when: .someday, folder: "trip"),
            task("novel", t("Write a novel", "Написать роман"), when: .someday),

            // Logbook
            task("milk", t("Buy milk", "Купить молоко"), doneAgo: 1),
            task("standup", t("Prepare standup notes", "Подготовить заметки к стендапу"), folder: "work", doneAgo: 5),
            task("laundry", t("Do the laundry", "Постирать"), folder: "home", doneAgo: 30),
        ]
        return (todos, folders)
    }
}
#endif
