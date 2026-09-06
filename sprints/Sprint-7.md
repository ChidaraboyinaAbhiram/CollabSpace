# Sprint 7 Documentation: User Presence System (Live Cursors & Typing Indicators)

## 1. Goal
The goal of Sprint 7 is to build the multi-user presence system in CollabSpace, including live online collaborator rosters, animated real-time typing indicators (`"Sarah is typing..."`), and colored collaborative cursor overlays that track remote peers' cursor and selection positions across the editor canvas.

## 2. Problem Statement
Without visual presence cues and remote cursor tracking, users editing the same document simultaneously cannot see where teammates are looking or what paragraph they are currently editing, leading to editing collisions and confusion.

## 3. Why We Need This Feature
In tools like Google Docs and Notion:
- Real-time cursor markers indicate active focus areas with user name tags and assigned identity colors.
- Typing indicators provide immediate feedback when someone begins drafting text, preventing simultaneous conflicting inputs.
- Active room presence rosters display who is currently online in the document.

## 4. Workflow
1. **Room Presence Roster**: When a user connects to a document, the server registers the socket in the document's active room map (`documentRooms`) and sends `document-presence` with all currently connected peers.
2. **Cursor Movement**: When a user moves their cursor or highlights text, Quill fires `selection-change` with `{ range, source: 'user' }`.
3. **Cursor Broadcast**: Client emits `cursor-move({ documentId, range })`.
4. **Remote Cursor Rendering**: Peers receive `remote-cursor-update` and calculate DOM pixel bounds via `quill.getBounds(range.index)`, rendering a colored vertical carat with a floating name tag above the character position.
5. **Typing States**: When a user enters text, `user-typing` is emitted to display animated bouncing dots and typist names. When typing pauses for 2 seconds, `user-stop-typing` clears the notification.
6. **Disconnection Cleanup**: When a user leaves, `user-left`, `remove-cursor`, and `user-stop-typing` events ensure immediate UI cleanup.

```
[ User A (Moves Cursor / Selection) ]                   [ Socket.IO Server ]                   [ User B (Observing) ]
                 |                                               |                                       |
     (Quill selection-change)                                    |                                       |
                 |                                               |                                       |
  +-- Emit "cursor-move" { docId, range, user } ---------------->|                                       |
                                                                 |                                       |
                                                         (Broadcast to room                              |
                                                          excluding sender)                              |
                                                                 |                                       |
                                                                 +-- Emit "remote-cursor-update" ------->+
                                                                                                         |
                                                                                             (Render Colored Cursor Carat
                                                                                               with "Alex" Name Tag)
```

## 5. Architecture
- **In-Memory Room Presence Map**: `documentRooms = new Map(docId -> Map(socketId -> userData))` maintains live socket memberships per active document.
- **Deterministic User Color Assignment**: Automatically generates distinct, high-contrast colors (Indigo, Emerald, Amber, Pink, Cyan, Violet, Orange) for each collaborator.
- **Quill DOM Coordinate Projection**: Uses `quill.getBounds(index)` to translate character index offsets into exact CSS pixel coordinates (`top`, `left`, `height`).
- **Ephemeral State Handling**: Cursor positions and typing states are kept in transient socket memory without incurring database write overhead.

## 6. Folder Changes
```
server/src/
├── controllers/
│   └── auth.controller.js            # Embedded user details (name, email) into JWT payload
├── middleware/
│   └── auth.middleware.js            # Unified JWT secret & payload decoding
└── socket/
    └── socket.server.js              # Presence tracking, cursor-move, and typing indicators

client/src/
├── components/
│   ├── CursorOverlay.jsx             # Floating collaborative cursor markers with name tooltips
│   └── TypingIndicator.jsx           # Animated typing indicator pill
└── pages/
    └── Editor.jsx                    # Bound selection-change listeners, cursor broadcasts, and typing states
```

## 7. Database Changes
No permanent schema migrations were required. Real-time presence is maintained in transient memory.

## 8. WebSocket Event Specifications
- `join-document`: `{ documentId }` - Joins room and receives active roster.
- `document-presence`: `[{ id, name, email, color }]` - Active room participants list.
- `cursor-move`: `{ documentId, range }` - Broadcasts cursor position.
- `remote-cursor-update`: `{ userId, range, user: { name, color } }` - Delivers remote cursor coordinates.
- `remove-cursor`: `{ userId }` - Clears remote cursor on user departure.
- `user-typing`: `{ documentId }` - Emits typing event.
- `user-stop-typing`: `{ documentId }` - Clears typing event after inactivity.

## 9. What I Learned
- **Quill Bounds Projection**: How `quill.getBounds(index)` computes DOM bounding boxes for arbitrary document character offsets.
- **Debounced Real-time State**: Setting transient 2-second timeout resets for ephemeral events like typing indicators.
- **Decoupled Cursor Overlays**: Rendering cursors in a `pointer-events-none` absolute layer over the editor to prevent interfering with text selection and clicking.

## 10. Interview Questions
1. **Q**: Why are real-time cursor coordinates and typing indicators kept in memory/WebSockets rather than persisted in PostgreSQL?
   - **A**: Cursor movements and typing events fire dozens of times per second. Persisting them to disk would cause massive database write bottlenecks and unnecessary I/O overhead. Ephemeral states are only relevant during live viewing sessions.
2. **Q**: How does `quill.getBounds(index)` work, and how does it calculate pixel coordinates for remote cursors?
   - **A**: `quill.getBounds()` inspects the underlying Parchment/DOM nodes, finds the leaf text node corresponding to the character index, and queries the browser layout engine (`getBoundingClientRect()`) to return `{ left, top, height }` relative to the editor container.
3. **Q**: How do you prevent cursor flickering when multiple users are typing simultaneously at different positions in the document?
   - **A**: When incoming Deltas are applied, Quill shifts the character indexes of existing content. Remote cursor positions must be transformed by incoming deltas or recalculated whenever the document length changes.
4. **Q**: How do you prevent network congestion when a user rapidly moves their mouse or cursor across the text?
   - **A**: Throttle cursor updates (e.g. at most once every 50ms) so that rapid keystrokes or mouse drags do not flood the WebSocket server with thousands of unnecessary packets.
5. **Q**: What happens to remote cursors and typing indicators when a user loses internet connectivity abruptly without emitting `leave-document`?
   - **A**: Socket.IO's heartbeat ping/pong mechanism detects the broken TCP socket and triggers the `disconnect` event on the server, which broadcasts `user-left` and `remove-cursor` to clean up orphaned UI markers.

## 11. Common Mistakes
- **Hardcoding Cursor Coordinates**: Using static coordinates instead of querying dynamic DOM bounds, causing cursors to misalign when window sizes or fonts change.
- **Blocking Text Selection**: Forgetting `pointer-events: none` on the cursor overlay layer, preventing users from clicking or selecting text beneath remote name tags.
- **Missing Disconnect Cleanup**: Not emitting cleanup events on server disconnect, leaving ghost cursors on peers' screens forever.

## 12. Best Practices
- **Deterministic Color Generation**: Hash the user's ID to deterministically select a distinct palette color so each user's cursor color is consistent across all peers.
- **Layered Z-Index Architecture**: Position cursor carats above text but below modals and dropdown menus.
- **Smart Pluralization**: Display user-friendly typing messages (e.g. `"Sarah is typing..."` vs `"Sarah and Alex are typing..."` vs `"Several people are typing..."`).

## 13. Homework
- **Coding Exercise 1**: Add selection highlighting: when a remote user selects a range of text (`range.length > 0`), render a semi-transparent colored highlight box over the selected characters.
- **Coding Exercise 2**: Add a sound toggle or subtle audio notification chime when a new collaborator joins the document room.
- **Conceptual Question 1**: How does Yjs or Automerge (CRDT libraries) handle cursor position transformations automatically when remote edits insert or delete text ahead of the cursor?
- **Conceptual Question 2**: What are the trade-offs between WebRTC data channels vs WebSocket servers for peer-to-peer cursor tracking?
- **Independent Challenge**: Build a "Follow Collaborator" mode: clicking a collaborator's avatar in the top bar automatically scrolls your viewport to follow their active cursor position.
