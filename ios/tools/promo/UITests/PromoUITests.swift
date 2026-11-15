import XCTest

/// Drives the installed wunder.rip DEBUG build (`-demo 1`) for the App Preview and the widget screenshot.
/// Environment: TEST_RUNNER_PROMO_LANG=en|ru for xcodebuild (app language, typed text).
/// Prints "PROMO_MARK <scene> <start|end> <unix time>" lines for cutting the video.
final class PromoUITests: XCTestCase {
    private let bundleId = "com.ilyapasyuk.wunderrip"
    private var env: [String: String] { ProcessInfo.processInfo.environment }
    private var lang: String { env["PROMO_LANG"] ?? "en" }
    private var ru: Bool { lang == "ru" }

    override func setUp() { continueAfterFailure = true }

    /// Scene marker in the test log; the simulator shares the Mac's clock, so record_preview.sh lines it up with the video.
    private func mark(_ scene: String, _ edge: String) {
        print("PROMO_MARK \(scene) \(edge) \(Date().timeIntervalSince1970)")
    }

    private func pause(_ seconds: Double) { Thread.sleep(forTimeInterval: seconds) }

    private func launch(_ extra: [String] = []) -> XCUIApplication {
        let app = XCUIApplication(bundleIdentifier: bundleId)
        app.launchArguments = ["-demo", "1", "-AppleLanguages", "(\(lang))", "-AppleLocale", ru ? "ru_RU" : "en_US"] + extra
        app.launch()
        return app
    }

    private func cell(_ app: XCUIApplication, _ title: String) -> XCUIElement {
        app.cells.containing(.staticText, identifier: title).firstMatch
    }

    private func typeSlowly(_ element: XCUIElement, _ text: String, delay: Double = 0.06) {
        for ch in text {
            element.typeText(String(ch))
            pause(delay)
        }
    }

    // MARK: - App Preview: one continuous take, cut by the markers

    func testPreview() {
        let app = launch()
        XCTAssertTrue(cell(app, ru ? "Позвонить в банк" : "Call the bank").waitForExistence(timeout: 10))
        pause(1.5)

        // 1. Today: complete a task
        mark("today", "start")
        pause(1.0)
        let check = cell(app, ru ? "Позвонить в банк" : "Call the bank").buttons.firstMatch
        _ = check.frame   // resolve before the sync mark
        mark("tap", "start")
        check.tap()
        mark("tap", "end")   // record_preview.sh finds this check turning green in the video to sync the clock
        pause(1.6)
        mark("today", "end")

        // 2. Quick entry: type a plan in plain words, chips preview it, add
        let field = app.textFields.firstMatch
        field.tap()
        pause(0.9)
        mark("compose", "start")
        typeSlowly(field, ru ? "Позвонить маме завтра в 18:00 #семья" : "Call mom tomorrow at 6pm #family")
        pause(1.2)
        field.typeText("\n")
        pause(1.3)
        mark("compose", "end")
        if app.keyboards.count > 0 { app.swipeDown(velocity: .slow) }
        pause(0.8)

        // 3. Task detail: repeat, checklist
        cell(app, ru ? "Посмотреть пулл-реквесты" : "Review pull requests").tap()
        pause(0.2)
        mark("detail", "start")
        pause(1.3)
        let repeatSwitch = app.switches.matching(NSPredicate(format: "label CONTAINS[c] %@", ru ? "Повтор" : "Repeat")).firstMatch
        if repeatSwitch.exists { repeatSwitch.switches.firstMatch.exists ? repeatSwitch.switches.firstMatch.tap() : repeatSwitch.tap() }
        pause(1.0)
        app.swipeUp(velocity: .slow)
        pause(0.8)
        let item = app.textFields.matching(NSPredicate(format: "value == %@", ru ? "Виджеты" : "Widgets")).firstMatch
        if item.exists {
            item.coordinate(withNormalizedOffset: CGVector(dx: 0, dy: 0.5)).withOffset(CGVector(dx: -28, dy: 0)).tap()
        }
        pause(1.4)
        mark("detail", "end")

        // 4. Upcoming by day
        app.navigationBars.buttons.firstMatch.tap()   // back to Today
        pause(0.8)
        app.navigationBars.buttons.firstMatch.tap()   // back to lists
        pause(1.0)
        mark("lists", "start")
        pause(1.2)
        app.staticTexts[ru ? "Предстоящие" : "Upcoming"].firstMatch.tap()
        pause(0.4)
        mark("lists", "end")
        mark("upcoming", "start")
        pause(1.2)
        app.swipeUp(velocity: .slow)
        pause(1.2)
        mark("upcoming", "end")
    }

    // MARK: - Widget on the home screen (screenshot)

    /// Adds the large wunder.rip Today widget to the first home screen page. The app must have run with -demo 1 once
    /// (it writes the widget snapshot). Leaves the home screen showing; the script takes the screenshot.
    func testAddWidget() {
        let app = launch()
        pause(3)
        app.terminate()
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        XCUIDevice.shared.press(.home)
        pause(1.5)
        // long press on an empty spot (below the last row of icons) → edit mode
        springboard.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.78)).press(forDuration: 1.6)
        pause(1.2)
        // the stock Maps widget shows the simulator's location: take it off this page
        let maps = springboard.icons.matching(NSPredicate(format: "(identifier == 'Maps' OR identifier == 'Карты') AND value CONTAINS[c] 'idget' OR (identifier == 'Карты' AND value CONTAINS[c] 'иджет')")).firstMatch
        if maps.exists {
            maps.buttons["DeleteButton"].tap(); pause(1)
            let remove = springboard.buttons.matching(NSPredicate(format: "label ==[c] 'Remove' OR label ==[c] 'Удалить'")).firstMatch
            if remove.waitForExistence(timeout: 3) { remove.tap(); pause(1.2) }
        }
        let edit = springboard.buttons.matching(NSPredicate(format: "label ==[c] 'Edit' OR label ==[c] 'Изменить'")).firstMatch
        if edit.waitForExistence(timeout: 3) { edit.tap(); pause(1) }
        let addWidget = springboard.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'Add Widget' OR label CONTAINS[c] 'Добавить виджет'")).firstMatch
        XCTAssertTrue(addWidget.waitForExistence(timeout: 4), springboard.debugDescription)
        addWidget.tap()
        pause(2)
        let search = springboard.searchFields.firstMatch
        if search.waitForExistence(timeout: 4) {
            search.tap(); search.typeText("wunder"); pause(1.5)
        }
        let result = springboard.cells.containing(NSPredicate(format: "label CONTAINS[c] 'wunder'")).firstMatch
        let resultAlt = springboard.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'wunder'")).firstMatch
        if result.waitForExistence(timeout: 3) { result.tap() } else if resultAlt.exists { resultAlt.tap() } else {
            XCTFail("no wunder.rip widget in gallery: \(springboard.debugDescription)"); return
        }
        pause(1.5)
        // swipe to the large size (gallery starts at small)
        springboard.swipeLeft(); pause(1.0)
        springboard.swipeLeft(); pause(1.0)
        let add = springboard.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'Add Widget' OR label CONTAINS[c] 'Добавить виджет'")).firstMatch
        XCTAssertTrue(add.waitForExistence(timeout: 4), springboard.debugDescription)
        add.tap()
        pause(1.5)
        let done = springboard.buttons.matching(NSPredicate(format: "label ==[c] 'Done' OR label ==[c] 'Готово'")).firstMatch
        if done.waitForExistence(timeout: 3) { done.tap() } else { XCUIDevice.shared.press(.home) }
        pause(2)
    }
}
