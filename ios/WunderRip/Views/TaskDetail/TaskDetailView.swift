import PhotosUI
import SwiftUI

/// Edits one task. Every change is saved right away; title and note after a short pause in typing.
struct TaskDetailView: View {
    let todo: Todo
    @EnvironmentObject private var appState: AppState

    @State private var taskText: String
    @State private var noteText: String
    @State private var newChecklistItem = ""
    @State private var newTag = ""
    @State private var selectedPhotoItem: PhotosPickerItem?
    @State private var isUploading = false
    @State private var uploadError: String?
    @State private var confirmDelete = false
    @FocusState private var focusedField: Field?

    private enum Field: Hashable { case title, note, newItem, newTag, item(String) }

    init(todo: Todo) {
        self.todo = todo
        _taskText = State(initialValue: todo.task)
        _noteText = State(initialValue: todo.note)
    }

    /// The task as it is now (edits come back from Firebase or demo memory).
    private var live: Todo { appState.todo(id: todo.id) ?? todo }
    private var today: Day { appState.today }

    var body: some View {
        Form {
            Section {
                HStack(alignment: .firstTextBaseline, spacing: 12) {
                    Button {
                        appState.toggleDone(live)
                    } label: {
                        Image(systemName: live.done ? "checkmark.circle.fill" : "circle")
                            .font(.title2)
                            .foregroundStyle(live.done ? AnyShapeStyle(.green) : AnyShapeStyle(.tertiary))
                    }
                    .buttonStyle(.plain)
                    .sensoryFeedback(.success, trigger: live.done) { _, new in new }
                    .accessibilityLabel(live.done ? Text("Mark as not done") : Text("Complete"))

                    TextField("Task", text: $taskText, axis: .vertical)
                        .font(.title3.weight(.semibold))
                        .focused($focusedField, equals: .title)
                        .onSubmit(commitTitle)
                }
                TextField("Notes", text: $noteText, axis: .vertical)
                    .lineLimit(3 ... 12)
                    .focused($focusedField, equals: .note)
            }

            whenSection
            deadlineSection
            repeatSection
            checklistSection
            tagsSection

            Section {
                Picker(selection: Binding(get: { live.folderId }, set: { appState.move(live, to: $0) })) {
                    Label("Inbox", systemImage: "tray").tag(String?.none)
                    ForEach(appState.folders) { folder in
                        Text(folder.name).tag(Optional(folder.id))
                    }
                } label: {
                    Label("List", systemImage: "list.bullet")
                }
            }

            photosSection

            Section {
                Button("Delete Task", role: .destructive) { confirmDelete = true }
            }
        }
        .navigationTitle(live.done ? Text("Completed") : Text("Task"))
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Done") { focusedField = nil }
            }
        }
        .confirmationDialog("Delete this task?", isPresented: $confirmDelete, titleVisibility: .visible) {
            Button("Delete Task", role: .destructive) { appState.delete(live) }
        }
        .task(id: taskText) {
            try? await Task.sleep(for: .milliseconds(600))
            if !Task.isCancelled { commitTitle() }
        }
        .task(id: noteText) {
            try? await Task.sleep(for: .milliseconds(600))
            if !Task.isCancelled { commitNote() }
        }
        .onDisappear {
            commitTitle()
            commitNote()
        }
    }

    private func save(_ change: (inout Todo) -> Void) {
        var updated = live
        change(&updated)
        guard updated != live else { return }
        appState.update(updated)
    }

    private func commitTitle() {
        let title = Todo.cleanTitle(taskText)
        guard !title.isEmpty else { return }
        save { $0.task = title }
    }

    private func commitNote() {
        save { $0.note = noteText }
    }

    // MARK: - When

    private var whenSection: some View {
        Section {
            Menu {
                ForEach(QuickWhen.allCases, id: \.self) { quick in
                    Button {
                        save { $0.when = $0.when.applying(quick, today: today) }
                    } label: {
                        Label(quick.title, systemImage: quick.symbol)
                    }
                }
            } label: {
                HStack {
                    Label {
                        Text("When").foregroundStyle(Color.primary)
                    } icon: {
                        Image(systemName: live.when.symbol(today: today))
                            .foregroundStyle(live.when.color(today: today))
                    }
                    Spacer()
                    Text(live.when.label(today: today))
                        .foregroundStyle(live.when == .anytime ? AnyShapeStyle(.secondary) : AnyShapeStyle(live.when.color(today: today)))
                }
            }

            DatePicker(
                selection: Binding(
                    get: { (live.when.day ?? today).date() },
                    set: { date in save { $0.when = $0.when.onDay(Day(date)) } }
                ),
                displayedComponents: .date
            ) {
                Label("Date", systemImage: "calendar")
            }

            if live.when.day != nil {
                Toggle(isOn: Binding(get: { live.when.isEvening }, set: { on in save { $0.when = $0.when.withEvening(on) } })) {
                    Label(live.when.day.map { $0 <= today } == true ? "This Evening" : "Evening", systemImage: "moon")
                }
                Toggle(isOn: Binding(
                    get: { live.when.reminder != nil },
                    set: { on in save { $0.when = $0.when.withReminder(on ? TimeOfDay(hour: 9, minute: 0) : nil) } }
                )) {
                    Label("Reminder", systemImage: "bell")
                }
                if let reminder = live.when.reminder {
                    DatePicker(
                        selection: Binding(get: { reminder.date }, set: { date in save { $0.when = $0.when.withReminder(TimeOfDay(date)) } }),
                        displayedComponents: .hourAndMinute
                    ) {
                        Label("Time", systemImage: "clock")
                    }
                }
            }
        }
    }

    // MARK: - Deadline

    private var deadlineSection: some View {
        Section {
            Toggle(isOn: Binding(
                get: { live.deadline != nil },
                set: { on in save { $0.deadline = on ? ($0.when.day ?? today) : nil } }
            )) {
                Label("Deadline", systemImage: "flag")
                    .foregroundStyle(live.isOverdue(today: today) ? .red : .primary)
            }
            if let deadline = live.deadline {
                DatePicker(
                    selection: Binding(get: { deadline.date() }, set: { date in save { $0.deadline = Day(date) } }),
                    displayedComponents: .date
                ) {
                    Text("Due")
                }
            }
        }
    }

    // MARK: - Repeat

    private var repeatSection: some View {
        Section {
            Toggle(isOn: Binding(
                get: { live.repeatRule != nil },
                set: { on in save { $0.repeatRule = on ? RepeatRule(unit: .week) : nil } }
            )) {
                Label("Repeat", systemImage: "repeat")
            }
            if let rule = live.repeatRule {
                Stepper(value: Binding(get: { rule.every }, set: { every in save { $0.repeatRule?.every = max(1, every) } }), in: 1 ... 99) {
                    Text(everyText(rule))
                }
                Picker("Unit", selection: Binding(get: { rule.unit }, set: { unit in save { $0.repeatRule?.unit = unit } })) {
                    ForEach(RepeatRule.Unit.allCases, id: \.self) { unit in
                        Text(unitTitle(unit)).tag(unit)
                    }
                }
                .pickerStyle(.segmented)
                Picker("Next one", selection: Binding(get: { rule.from }, set: { from in save { $0.repeatRule?.from = from } })) {
                    Text("On schedule").tag(RepeatRule.From.schedule)
                    Text("After completion").tag(RepeatRule.From.completion)
                }
            }
        }
    }

    private func everyText(_ rule: RepeatRule) -> String {
        switch rule.unit {
        case .day: String(localized: "Every \(rule.every) day(s)")
        case .week: String(localized: "Every \(rule.every) week(s)")
        case .month: String(localized: "Every \(rule.every) month(s)")
        case .year: String(localized: "Every \(rule.every) year(s)")
        }
    }

    private func unitTitle(_ unit: RepeatRule.Unit) -> String {
        switch unit {
        case .day: String(localized: "Day")
        case .week: String(localized: "Week")
        case .month: String(localized: "Month")
        case .year: String(localized: "Year")
        }
    }

    // MARK: - Checklist

    private var checklistSection: some View {
        Section {
            ForEach(live.checklist) { item in
                HStack(spacing: 10) {
                    Button {
                        save { task in
                            if let i = task.checklist.firstIndex(where: { $0.id == item.id }) { task.checklist[i].done.toggle() }
                        }
                    } label: {
                        Image(systemName: item.done ? "checkmark.circle.fill" : "circle")
                            .foregroundStyle(item.done ? AnyShapeStyle(.green) : AnyShapeStyle(.tertiary))
                    }
                    .buttonStyle(.plain)
                    TextField("Item", text: Binding(
                        get: { item.title },
                        set: { title in
                            save { task in
                                if let i = task.checklist.firstIndex(where: { $0.id == item.id }) { task.checklist[i].title = title }
                            }
                        }
                    ))
                    .focused($focusedField, equals: .item(item.id))
                    .strikethrough(item.done)
                    .foregroundStyle(item.done ? .secondary : .primary)
                }
            }
            .onDelete { offsets in save { $0.checklist.remove(atOffsets: offsets) } }
            .onMove { from, to in save { $0.checklist.move(fromOffsets: from, toOffset: to) } }

            HStack(spacing: 10) {
                Image(systemName: "plus").foregroundStyle(.secondary)
                TextField("Add item", text: $newChecklistItem)
                    .focused($focusedField, equals: .newItem)
                    .submitLabel(.next)
                    .onSubmit {
                        let title = newChecklistItem.trimmingCharacters(in: .whitespacesAndNewlines)
                        guard !title.isEmpty else { return }
                        save { $0.checklist.append(ChecklistItem(title: title)) }
                        newChecklistItem = ""
                        focusedField = .newItem
                    }
            }
        } header: {
            if let progress = live.checklistProgress {
                Text("Checklist \(progress.done)/\(progress.total)")
            } else {
                Text("Checklist")
            }
        }
    }

    // MARK: - Tags

    private var tagsSection: some View {
        Section("Tags") {
            if !live.tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack {
                        ForEach(live.tags, id: \.self) { tag in
                            Button {
                                save { $0 = $0.removingTag(tag) }
                            } label: {
                                Label(tag, systemImage: "xmark")
                                    .labelStyle(TrailingIconLabelStyle())
                            }
                            .buttonStyle(.bordered)
                            .buttonBorderShape(.capsule)
                            .controlSize(.small)
                            .accessibilityLabel(Text("Remove tag \(tag)"))
                        }
                    }
                }
            }
            HStack(spacing: 10) {
                Image(systemName: "tag").foregroundStyle(.secondary)
                TextField("Add tag", text: $newTag)
                    .focused($focusedField, equals: .newTag)
                    .textInputAutocapitalization(.never)
                    .onSubmit { addTag(newTag) }
            }
            let suggestions = TagSuggestions.suggestions(for: newTag, in: appState.todos, excluding: live.tags)
            if !suggestions.isEmpty, focusedField == .newTag || !newTag.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack {
                        ForEach(suggestions, id: \.self) { tag in
                            Button(tag) { addTag(tag) }
                                .buttonStyle(.bordered)
                                .buttonBorderShape(.capsule)
                                .controlSize(.small)
                        }
                    }
                }
            }
        }
    }

    private func addTag(_ raw: String) {
        save { $0 = $0.addingTag(raw) }
        newTag = ""
    }

    // MARK: - Photos

    private var photosSection: some View {
        Section("Photos") {
            let files = live.files
            if !files.isEmpty {
                ScrollView(.horizontal) {
                    HStack {
                        ForEach(files, id: \.self) { fileId in
                            imageThumb(fileId)
                        }
                    }
                }
            }
            PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                if isUploading {
                    ProgressView()
                } else {
                    Label("Add Photo", systemImage: "photo.badge.plus")
                }
            }
            .disabled(isUploading || appState.isDemo)
            .onChange(of: selectedPhotoItem) { _, newItem in
                uploadPhoto(newItem)
            }
            if let uploadError {
                Text(uploadError)
                    .font(.footnote)
                    .foregroundStyle(.red)
            }
        }
    }

    @ViewBuilder
    private func imageThumb(_ fileId: String) -> some View {
        if let url = CloudinaryService.thumbURL(id: fileId, width: 200, height: 200) {
            AsyncImage(url: url) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                ProgressView()
            }
            .frame(width: 90, height: 90)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(alignment: .topTrailing) {
                Button {
                    save { $0.files.removeAll { $0 == fileId } }
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.white, .black.opacity(0.6))
                }
                .padding(4)
            }
        }
    }

    private func uploadPhoto(_ item: PhotosPickerItem?) {
        guard let item else { return }
        isUploading = true
        uploadError = nil
        Task {
            defer {
                isUploading = false
                selectedPhotoItem = nil
            }
            do {
                guard let data = try await item.loadTransferable(type: Data.self) else { return }
                let publicId = try await CloudinaryService.upload(imageData: data)
                save { $0.files.append(publicId) }
            } catch {
                uploadError = error.localizedDescription
            }
        }
    }
}

/// Title first, icon after ("work ✕").
private struct TrailingIconLabelStyle: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: 4) {
            configuration.title
            configuration.icon.imageScale(.small)
        }
    }
}
