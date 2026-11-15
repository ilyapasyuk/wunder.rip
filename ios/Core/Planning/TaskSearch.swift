import Foundation

/// Full-text filter over all tasks: every word of the query must appear in the title, note, a tag or a checklist item.
enum TaskSearch {
    static func filter(_ todos: [Todo], query: String) -> [Todo] {
        let words = query.split(whereSeparator: \.isWhitespace).map { fold(String($0)) }
        guard !words.isEmpty else { return [] }
        return todos.filter { todo in
            let haystack = fold(([todo.task, todo.note] + todo.tags + todo.checklist.map(\.title)).joined(separator: "\n"))
            return words.allSatisfy(haystack.contains)
        }
    }

    /// Case- and diacritic-insensitive form ("Ёлка" → "елка").
    private static func fold(_ text: String) -> String {
        text.folding(options: [.caseInsensitive, .diacriticInsensitive], locale: nil)
    }
}
