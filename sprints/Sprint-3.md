# Sprint 3 Documentation: Rich Text Editor & Document CRUD (Autosave)

## 1. Goal
The goal of Sprint 3 is to integrate a full-featured rich text editing canvas (`react-quill-new`), implement the document update endpoint (`PUT /api/documents/:id`), and build a debounced autosaving engine with real-time status indicators.

## 2. Problem Statement
In traditional web forms, users must manually click a "Save" button to persist changes. If a user accidentally closes their tab, loses internet connectivity, or experiences a browser crash, unsaved changes are lost forever. Additionally, standard textareas lack rich styling (headings, code blocks, lists, bold/italics).

## 3. Why We Need This Feature
In modern collaborative apps like Google Docs and Notion:
- Real-time rich text editing is the central writing interface.
- Autosaving must run seamlessly in the background without causing input latency or UI freezes.
- Users need clear visual feedback (`"Saving..."` / `"Saved to Cloud"`) so they know their data is safely persisted.

## 4. Workflow
1. **Document Loading**: When visiting `/document/:id`, React calls `getDocumentById(id)`. The editor initializes with the saved title, icon, and HTML content.
2. **Local Keystroke**: When a user types or formats text, React state updates immediately with 0ms delay.
3. **Debounced Timer**: A 1.5-second timer is initiated. If the user continues typing, the previous timer is cancelled and reset.
4. **Cloud Persistence**: When typing pauses for 1.5s, the timer executes `updateDocument(id, { title, icon, content })` via `PUT /api/documents/:id`.
5. **Visual Feedback**: The status pill dynamically shifts from `"Unsaved changes..."` -> `"Saving..."` -> `"Saved to Cloud"`.

```
[ User Types in Editor ]
           |
           +---> 1. Update Editor UI Instantly (0ms lag)
           |
           +---> 2. Set Status: "Unsaved changes..."
           |
           +---> 3. Reset 1500ms Debounce Timer
                       |
                       v (User pauses typing for 1.5s)
           [ Trigger PUT /api/documents/:id with Content & Title ]
                       |
                       +---> Set Status: "Saving..."
                       |
                       v
           [ Express Backend Updates Record in PostgreSQL / DB ]
                       |
                       v (200 OK Response)
           [ Status Pill Transitions to: "Saved to Cloud" ✅ ]
```

## 5. Architecture
- **Quill DOM Virtualization**: Quill maintains an internal Delta representation mapping to DOM nodes, supporting headings (H1-H3), formatting, code blocks, and blockquotes.
- **Custom React Debounce Hook / Timer**: Using `useRef` to store the active timeout reference across re-renders, preventing memory leaks and duplicate network requests.
- **Stateless REST Update API**: `PUT /api/documents/:id` strictly validates owner authorization (`doc.ownerId === req.user.id`) and updates `updatedAt` timestamps.

## 6. Folder Changes
```
server/
├── src/
│   ├── controllers/
│   │   └── document.controller.js      # Added updateDocument handler
│   └── routes/
│       └── document.routes.js          # Added PUT /:id route

client/
├── package.json                        # Installed react-quill-new
├── src/
│   ├── index.css                       # Added custom dark theme rules for Quill
│   ├── services/
│   │   └── document.service.js         # Added updateDocument API method
│   ├── pages/
│   │   └── Editor.jsx                  # Rich text editor page with autosave
│   └── App.jsx                         # Registered /document/:id route
```

## 7. Database Changes
No structural migrations were needed because `Document` already contained `content: String? @default("")` and `title: String`. The `content` column now stores rich text HTML/Delta strings.

## 8. API Changes
### `PUT /api/documents/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "title": "Production Architecture Specs",
    "icon": "🚀",
    "content": "<h1>Architecture</h1><p>Real-time collaborative editing...</p>"
  }
  ```
- **Response**: `200 OK` with updated document payload.

## 9. What I Learned
- **Debouncing vs. Throttling**: Why debouncing (delaying until activity stops) is the ideal choice for autosave, whereas throttling (firing at fixed intervals) is used for scroll listeners.
- **Clean React State Isolation**: Preventing initial component mount from triggering accidental false autosave network requests using `isInitialLoadRef`.
- **Rich Text Content Sanitization**: Extracting plain text from HTML tags for live word/character statistics.

## 10. Interview Questions
1. **Q**: What is the difference between Debouncing and Throttling in JavaScript?
   - **A**: **Debouncing** delays the execution of a function until a specified period of inactivity has elapsed (e.g. waiting 1.5s after the last keystroke to save). **Throttling** limits the execution of a function to at most once in every specified time window (e.g. handling a resize event at most once every 200ms).
2. **Q**: Why is `useRef` used instead of `useState` to store debounce timer IDs in React?
   - **A**: Updating a `useRef` (`timerRef.current = setTimeout(...)`) does not trigger a component re-render. `useState` would trigger an unnecessary re-render on every keystroke just to store the timer ID.
3. **Q**: How does Quill editor represent rich text internally? What is a Delta?
   - **A**: A Quill Delta is a strict, JSON-based format describing document changes as a sequence of `insert`, `retain`, and `delete` operations with formatting attributes. Deltas are much easier to synchronize over WebSockets (OT/CRDT) than raw HTML strings.
4. **Q**: How do you prevent race conditions when multiple autosave requests are in flight?
   - **A**: Debouncing prevents rapid successive requests. Additionally, each document update can carry a version number or timestamp; the server rejects or merges older timestamps to ensure newer edits never get overwritten by stale network responses.
5. **Q**: What are the security risks of rendering rich text HTML in React, and how do you prevent XSS attacks?
   - **A**: If untrusted HTML containing `<script>` tags or `onload=` handlers is rendered using `dangerouslySetInnerHTML`, attackers can execute arbitrary code in the user's browser. Mitigate this by sanitizing HTML (using libraries like DOMPurify) on both the client and server.

## 11. Common Mistakes
- **Saving on Initial Render**: Forgetting an initial load flag (`isInitialLoadRef`), causing an immediate PUT request to fire right when the editor loads.
- **Uncontrolled Re-renders**: Triggering autosave on every render cycle instead of scoping it to user interaction callbacks.
- **Memory Leaks**: Forgetting to call `clearTimeout(timerRef.current)` in the `useEffect` cleanup function when the user navigates away.

## 12. Best Practices
- **Visual Feedback**: Always provide an unambiguous save state indicator (`"Saved"`, `"Saving..."`, `"Unsaved changes"`) so users never doubt if their work is safe.
- **Non-blocking UI**: Keep the editor state updates synchronous and local, offloading network requests to asynchronous background promises.
- **Word/Character Counters**: Strip HTML tags using regex (`content.replace(/<[^>]*>/g, '')`) before computing word lengths.

## 13. Homework
- **Coding Exercise 1**: Add a keyboard shortcut (`Ctrl + S` / `Cmd + S`) that immediately triggers a forced save, bypassing the 1.5s debounce delay.
- **Coding Exercise 2**: Add a "Reading Time" estimator badge on the top bar (e.g. `"2 min read"`, assuming an average reading speed of 200 words per minute).
- **Conceptual Question 1**: How do Operational Transformation (OT) and Conflict-free Replicated Data Types (CRDTs) differ when synchronizing rich text editors across multiple real-time users?
- **Conceptual Question 2**: Why do modern collaborative editors (like Notion) store documents as structured blocks (JSON nodes) rather than a single massive HTML string?
- **Independent Challenge**: Add an "Export Document" dropdown menu allowing users to download their document as a Markdown file (`.md`) or HTML file (`.html`).
