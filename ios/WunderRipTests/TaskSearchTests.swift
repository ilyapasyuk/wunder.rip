import XCTest

final class TaskSearchTests: XCTestCase {
    private let todos = [
        makeTask("title", title: "Buy Milk"),
        makeTask("note", title: "Errands", note: "milk and bread"),
        makeTask("tag", title: "Call", tags: ["Shopping"]),
        makeTask("checklist", title: "Party", checklist: [ChecklistItem(id: "1", title: "Order cake")]),
        makeTask("russian", title: "Позвонить Ёлке"),
    ]

    private func search(_ query: String) -> [String] { TaskSearch.filter(todos, query: query).map(\.id) }

    func testMatchesTitleNoteTagsAndChecklistIgnoringCase() {
        XCTAssertEqual(search("MILK"), ["title", "note"])
        XCTAssertEqual(search("shop"), ["tag"])
        XCTAssertEqual(search("cake"), ["checklist"])
    }

    func testEveryWordMustMatchSomewhere() {
        XCTAssertEqual(search("milk bread"), ["note"])
        XCTAssertEqual(search("milk cake"), [])
    }

    func testIgnoresDiacriticsAndCyrillicCase() {
        XCTAssertEqual(search("елке"), ["russian"])
        XCTAssertEqual(search("ПОЗВОНИТЬ"), ["russian"])
    }

    func testBlankQueryFindsNothing() {
        XCTAssertEqual(search("   "), [])
    }
}
