import SwiftUI

struct WorkspaceView: View {
    @State private var showAccount = false

    var body: some View {
        NavigationSplitView {
            SidebarView()
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            showAccount = true
                        } label: {
                            Image(systemName: "person.circle")
                        }
                    }
                }
        } detail: {
            NavigationStack {
                TaskListView()
            }
        }
        .sheet(isPresented: $showAccount) {
            NavigationStack {
                AccountView()
            }
        }
    }
}
