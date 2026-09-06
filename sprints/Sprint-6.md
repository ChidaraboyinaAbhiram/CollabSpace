# Sprint 6 Documentation: Socket.IO Real-time Sync

## 1. Goal
The goal of Sprint 6 is to build the bi-directional WebSocket synchronization pipeline using `Socket.IO`, implement JWT handshake authentication, create per-document collaboration rooms, and broadcast Quill Delta text changes between concurrent browsers with sub-50ms latency.

## 2. Problem Statement
Prior to this sprint, document synchronization relied solely on periodic REST polling or manual page reloads. If two users edited the same document simultaneously, their changes would overwrite each other (lost updates) and neither user would see the other's typing in real time.

## 3. Why We Need This Feature
In applications like Google Docs and Notion:
- Full-duplex persistent WebSocket connections eliminate HTTP request overhead.
- As a user types, tiny Delta objects (`insert`, `delete`, `retain`) are streamed immediately to all connected collaborators in the same document room.
- Infinite echo loops must be prevented by ignoring incoming API-originated deltas (`source !== 'user'`).

## 4. Workflow
1. **WebSocket Handshake**: Client connects to `ws://localhost:5000` passing JWT token in `{ auth: { token } }`.
2. **Handshake Verification**: Server validates the JWT signature in `io.use()` middleware.
3. **Room Joining**: Client emits `join-document(documentId)`. The server assigns the socket to the room matching that `documentId`.
4. **Typing & Delta Emission**: When User A types, Quill fires `text-change` with `source === 'user'`. The client emits `send-changes({ documentId, delta })`.
5. **Delta Broadcasting**: The server calls `socket.to(documentId).emit('receive-changes', delta)`, delivering the delta to all other peers in the room.
6. **Local Application**: User B's client receives `receive-changes(delta)` and applies it via `quill.updateContents(delta)` with `source === 'api'`, preventing an echo feedback loop.

```
[ User A (Typing) ]                   [ Socket.IO Server ]                   [ User B (Observing) ]
         |                                     |                                       |
  (Types "Hello")                              |                                       |
         |                                     |                                       |
  (Quill text-change)                          |                                       |
         |                                     |                                       |
         +--- Emit "send-changes" { delta } -->|                                       |
                                               |                                       |
                                       (Broadcast to docId room                        |
                                        excluding sender)                              |
                                               |                                       |
                                               +--- Emit "receive-changes" { delta } ->+
                                                                                       |
                                                                              (Quill.updateContents)
                                                                                       |
                                                                              (Renders "Hello" instantly)
```

## 5. Architecture
- **Bi-directional WebSocket Engine**: `Socket.IO` manages persistent TCP connections with automatic fallback to HTTP Long-Polling.
- **Dynamic Collaboration Rooms**: Native Socket.IO rooms isolate document communications, ensuring messages are only broadcast to users currently viewing the same document ID.
- **Delta-level Granularity**: Sending Quill Deltas rather than entire HTML documents reduces network bandwidth by over 95%.
- **Echo-Loop Prevention**: Checking `source === 'user'` on Quill events guarantees that remotely applied changes do not trigger duplicate outgoing broadcasts.

## 6. Folder Changes
```
server/
├── package.json                        # Installed socket.io
├── src/
│   ├── socket/
│   │   └── socket.server.js            # Socket.IO setup, JWT auth handshake, room handlers
│   └── server.js                       # Attached http.createServer to Socket.IO

client/
├── package.json                        # Installed socket.io-client
├── src/
│   ├── services/
│   │   └── socket.service.js           # Client Socket.IO singleton instance
│   └── pages/
│       └── Editor.jsx                  # Real-time Delta syncing with Quill editor
```

## 7. Database Changes
No new migrations were required. Socket.IO integrates with the existing `Document` model to persist real-time edits.

## 8. WebSocket Event Specifications
- `join-document`: `{ documentId }` - Client joins document collaboration room.
- `leave-document`: `{ documentId }` - Client leaves room.
- `send-changes`: `{ documentId, delta }` - Active typer streams edits to server.
- `receive-changes`: `delta` - Server broadcasts edits to all other peers in room.
- `user-joined`: `{ id, name, email }` - Informs room of newly arrived collaborator.
- `user-left`: `{ userId }` - Informs room when a collaborator closes the tab.

## 9. What I Learned
- **WebSocket Handshake Authentication**: Validating JWT tokens at the socket connection level using `io.use()` rather than passing tokens in every event payload.
- **Preventing Echo Feedback Loops**: Utilizing the `source` parameter in rich text editors (`'user'` vs `'api'`) to stop infinite broadcast loops.
- **Socket.IO Room Mechanics**: How `socket.to(room).emit()` broadcasts to everyone in a room *except* the sender.

## 10. Interview Questions
1. **Q**: What are the differences between HTTP Polling, Server-Sent Events (SSE), and WebSockets? Why is WebSocket best suited for collaborative editing?
   - **A**: **HTTP Polling** repeatedly sends requests at intervals, causing high latency and header overhead. **SSE** is unidirectional (server-to-client only). **WebSockets** provide persistent, low-latency, bi-directional full-duplex communication over a single TCP connection, ideal for real-time keystroke synchronization.
2. **Q**: How does Socket.IO's room architecture work, and how does it scale when multiple server instances are deployed?
   - **A**: Socket.IO rooms group sockets in server memory. When scaling horizontally across multiple Node.js instances behind a load balancer, Socket.IO uses a **Redis Adapter** (Pub/Sub) to broadcast room events across all servers.
3. **Q**: What is an "Echo Loop" in real-time collaborative editing, and how do you prevent it?
   - **A**: An echo loop occurs when Client A sends a change, Client B receives it and updates its editor, which inadvertently triggers another "change" event that sends the change back to Client A. Prevent this by checking `source === 'user'` before emitting outgoing socket events.
4. **Q**: Why is JWT authentication done during the WebSocket handshake (`io.use()`) instead of inside individual event listeners?
   - **A**: Handshake authentication ensures that unauthorized clients are rejected immediately before consuming server memory or joining rooms, eliminating redundant token validation on high-frequency typing events.
5. **Q**: What is the difference between Delta synchronization and sending full HTML snapshots on every keystroke?
   - **A**: Sending full HTML strings transmits kilobytes of duplicate data on every keystroke, causing severe network congestion and cursor jumps. Deltas describe only the localized edit (e.g. `{ insert: 'a' }`), consuming minimal bandwidth and enabling non-destructive merges.

## 11. Common Mistakes
- **Broadcasting to the Sender**: Using `io.to(room).emit()` instead of `socket.to(room).emit()`, which causes the active typist to receive their own keystrokes back.
- **Memory Leaks in Event Listeners**: Forgetting to remove socket listeners (`socket.off('receive-changes')`) when the React component unmounts.
- **Missing Token Expiration Handling**: Not handling expired JWT tokens during socket reconnection attempts.

## 12. Best Practices
- **Singleton Socket Connection**: Maintain a single active socket client instance rather than opening new connections on every component mount.
- **Heartbeat & Auto-reconnect**: Configure Socket.IO reconnection attempts with exponential backoff to handle temporary network drops gracefully.
- **Room Isolation**: Always scope document events to specific `documentId` rooms to ensure zero cross-document data leakage.

## 13. Homework
- **Coding Exercise 1**: Add a connection status pill in the top header (e.g., green dot for `"Connected"`, yellow dot for `"Reconnecting..."`, red dot for `"Disconnected"`).
- **Coding Exercise 2**: Implement a `typing` event in `socket.server.js` that emits `{ userName }` when a user is typing and clears it 1 second after typing stops.
- **Conceptual Question 1**: How do Operational Transformation (OT) and Conflict-free Replicated Data Types (CRDTs) resolve simultaneous conflicting edits at the same document index?
- **Conceptual Question 2**: Why is sticky sessions (session affinity) required when load balancing Socket.IO servers that use HTTP Long-Polling before upgrading to WebSockets?
- **Independent Challenge**: Build an online active users badge in the editor header showing the live count of users currently connected to the document room.
