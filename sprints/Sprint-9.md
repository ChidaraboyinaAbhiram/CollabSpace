# Sprint 9 Documentation: Version History & Restoration

## 1. Goal
The goal of Sprint 9 is to build the document revision and snapshot recovery system in CollabSpace, allowing users to capture named version checkpoints, browse chronological historical snapshots, preview past content in read-only mode, and restore previous versions with automatic pre-restoration safety backups and real-time WebSocket synchronization.

## 2. Problem Statement
Collaborative documents undergo constant revisions by multiple team members. When accidental deletions or unwanted formatting changes occur, users need a foolproof mechanism to review previous versions and restore content without losing recent work.

## 3. Why We Need This Feature
In tools like Google Docs and Notion:
- Version timelines provide an immutable audit trail of document evolution.
- Read-only preview panes allow users to compare past revisions before committing to a restore.
- Point-in-time restoration rolls back the active document state and notifies all active room collaborators instantly.
- Automatic safety backups ensure that reverting to an older snapshot never destroys intervening changes.

## 4. Workflow
1. **Snapshot Creation**: Users can capture a named milestone (e.g. `"Sprint 9 Final Draft"`) or automated checkpoint. Calling `POST /api/documents/:id/versions` clones the current title, content, and author attribution into `DocumentVersion`.
2. **Timeline Browsing**: Opening the Version History drawer requests `GET /api/documents/:id/versions` and renders a chronological feed of revision cards with timestamps and author avatars.
3. **Snapshot Preview**: Clicking any version in the timeline renders its historical HTML content in a read-only preview canvas.
4. **Point-in-Time Restore**: Clicking "Restore This Version" calls `POST /api/documents/:id/versions/:id/restore`:
   - An automatic `"Pre-Restore Backup"` snapshot is created capturing the current state.
   - The active `Document` record is updated with the target version's content.
   - The server emits `document-restored` over Socket.IO to re-render all connected collaborator editors simultaneously.

```
[ User Selects Historical Version from Timeline ]
                            |
              [ Previews Content in Read-Only Canvas ]
                            |
              [ Clicks "Restore This Version" ]
                            |
        [ POST /api/documents/:id/versions/:id/restore ]
                            |
       +--------------------+--------------------+
       |                                         |
[ Auto-Creates Safety Snapshot ]         [ Updates Main Document ]
       |                                         |
       +--------------------+--------------------+
                            |
       [ WebSocket Broadcasts "document-restored" ]
                            |
       [ All Connected Browsers Instantly Re-render ]
```

## 5. Architecture
- **Immutable Snapshot Model**: `DocumentVersion` records are immutable historical snapshots linked to `documentId` and attributed to `createdById`.
- **Pre-Restoration Safety Mechanism**: Restoring a version always generates an automatic backup snapshot of the pre-restoration state, guaranteeing zero data loss.
- **WebSocket Synchronization**: The `document-restored` event streams updated contents to all connected room peers, dynamically updating Quill DOM editors without requiring manual page reloads.
- **Split-Pane Drawer Layout**: Features a left timeline navigator and a right read-only preview pane with visual restore confirmation.

## 6. Folder Changes
```
server/
├── prisma/
│   └── schema.prisma                    # Enhanced DocumentVersion model with author relation
├── src/
│   ├── controllers/
│   │   ├── version.controller.js        # Version snapshot, list, preview, and restore handlers
│   │   └── document.controller.js       # Optimized with fast DB timeout helpers
│   ├── routes/
│   │   ├── version.routes.js            # Version routes mounted at /:id/versions
│   │   └── document.routes.js           # Mounted version sub-route
│   └── socket/
│       └── socket.server.js             # Added version-created and document-restored events

client/src/
├── components/
│   └── VersionHistoryDrawer.jsx         # Sliding revision timeline drawer with preview & restore
├── services/
│   └── version.service.js               # Version API client service
└── pages/
    └── Editor.jsx                       # Bound Version History drawer, snapshot button, and live restore listener
```

## 7. Database Changes
- **`DocumentVersion` Model**:
  - `id`: `String` (UUID primary key)
  - `title`: `String`
  - `content`: `String?`
  - `versionName`: `String?` (`@default("Automatic Snapshot")`)
  - `documentId`: `String` (foreign key -> `Document.id` with `onDelete: Cascade`)
  - `createdById`: `String?` (foreign key -> `User.id` with `onDelete: SetNull`)
  - `createdAt`: `DateTime` (`@default(now())`)
  - Indexes configured on `[documentId]` and `[createdById]`.

## 8. API & WebSocket Specifications
- `POST /api/documents/:id/versions`: `{ versionName }` - Captures document snapshot.
- `GET /api/documents/:id/versions`: Returns all historical version nodes.
- `GET /api/documents/:id/versions/:versionId`: Returns detailed content of single version snapshot.
- `POST /api/documents/:id/versions/:versionId/restore`: Restores active document to target version.
- WebSocket Events: `version-created` -> `version-created`, `restore-document` -> `document-restored`.

## 9. What I Learned
- **Point-in-Time Recovery Patterns**: Designing non-destructive version restoration with automated pre-restore checkpoints.
- **Read-Only Context Previews**: Rendering historical HTML safely within a preview pane without risking accidental mutations.
- **Synchronizing State Across Real-Time Peers**: Broadcasting restoration events over WebSockets to force-synchronize editor DOM states across all active users.

## 10. Interview Questions
1. **Q**: What are the trade-offs between storing full document snapshots vs differential deltas (reverse diffs) in version history systems?
   - **A**: **Full snapshots** are fast to retrieve and simple to restore with O(1) query complexity, but consume more disk storage. **Differential deltas** (like Git) minimize storage by saving only diffs, but require replaying the chain of commits to reconstruct an older state (O(N) computation). In production, hybrid **Snapshot + Delta Chaining** (e.g. keyframes every 20 versions) provides the ideal balance.
2. **Q**: How do you prevent version history tables from growing uncontrollably in high-frequency collaborative editing apps?
   - **A**: Implement **snapshot throttling and compaction policies** (e.g., save automatic snapshots at most once every 10 minutes, merge hourly snapshots into daily milestones after 7 days, and archive snapshots older than 30 days to cold storage like S3/GCS).
3. **Q**: Why is `onDelete: SetNull` preferred over `onDelete: Cascade` for the `createdById` relation in audit/version history tables?
   - **A**: If a team member leaves the company and their user account is deleted, the document versions they created should be preserved for audit history rather than deleted with their user record.
4. **Q**: How do you handle active user cursors and pending unsaved local debounced edits when a version restoration event is broadcasted?
   - **A**: The client resets its local autosave debounce timer, applies the restored HTML to the editor, resets selection ranges, and increments the document sync sequence.
5. **Q**: How do you generate visual diffs (green additions, red deletions) when comparing two historical snapshots?
   - **A**: Use the **Myers Diff Algorithm** (e.g., via the `diff-match-patch` library) to compare the text nodes of Version A and Version B and wrap added characters in `<ins>` and removed characters in `<del>`.

## 11. Common Mistakes
- **Destructive Restorations**: Overwriting active document content without first creating a backup snapshot, permanently destroying recent work.
- **Missing Peer Notification**: Restoring a document via REST without emitting a WebSocket event, causing other active users to continue typing on obsolete versions and overwriting the restore.
- **Unsanitized HTML in Preview**: Injecting untrusted raw HTML strings directly without appropriate sanitization.

## 12. Best Practices
- **Safety First**: Always create automated pre-restore backups labeled with timestamps.
- **Named Milestones**: Allow users to assign custom names (e.g., `"v1.0 Release Candidate"`) to important revisions.
- **Read-Only Safeguards**: Disable typing and editing completely while the version history drawer or preview pane is active.

## 13. Homework
- **Coding Exercise 1**: Add a "Diff Comparison Mode" in `VersionHistoryDrawer.jsx` showing side-by-side green and red highlights between the selected version and current document.
- **Coding Exercise 2**: Add a "Download as Markdown / PDF" button inside the Version History preview pane.
- **Conceptual Question 1**: How does Git's Directed Acyclic Graph (DAG) commit model compare to linear document version histories?
- **Conceptual Question 2**: How would you implement version history branching (allowing users to create a new independent document from an older revision snapshot)?
- **Independent Challenge**: Build an automated checkpoint trigger in the backend that creates a version snapshot every 50 saved keystrokes or every 15 minutes of continuous editing.
