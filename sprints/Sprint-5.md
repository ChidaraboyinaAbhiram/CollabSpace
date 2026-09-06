# Sprint 5 Documentation: React State & Custom Contexts

## 1. Goal
The goal of Sprint 5 is to establish centralized state management for documents and collaborative sessions using React Context API (`DocumentContext`), create a production-ready reusable UI component kit, and build an interactive collaborative `<ShareModal />` with Role-Based Access Control (RBAC).

## 2. Problem Statement
Passing document data, save statuses, and collaborator rosters through deeply nested component props (prop drilling) leads to brittle, unmaintainable code. Furthermore, users had no UI mechanism to invite collaborators, assign permissions (`EDITOR` vs `VIEWER`), or copy shareable document URLs.

## 3. Why We Need This Feature
In applications like Google Docs and Notion:
- The editor header, canvas, collaborator avatars stack, and share modals all need access to the same live document state without tight coupling.
- Document owners must be able to invite teammates, toggle permissions, and revoke access at any time.
- Standardized UI components (`Button`, `Modal`, `Badge`, `Input`, `Avatar`) ensure visual consistency across the entire application.

## 4. Workflow
1. **DocumentProvider Initialization**: `Editor` wraps `EditorInner` with `<DocumentProvider documentId={id}>`.
2. **Context Consumption**: Any child component accesses `title`, `content`, `saveStatus`, `collaborators`, and helper methods via `useDocument()`.
3. **Sharing Dialog**: Document owner clicks "Share" in the editor top bar, opening `<ShareModal />`.
4. **Invite Submission**: Owner inputs an email (`sarah@collabspace.com`) and selects role (`EDITOR`).
5. **Backend Authorization & Upsert**: Express verifies requester ownership, finds the user by email, and creates/updates a `Collaborator` record.
6. **Live State Synchronization**: `DocumentContext` updates its `collaborators` array, and Sarah's avatar instantly appears in the header avatar stack.

```
                    +------------------------------------+
                    |          DocumentProvider          |
                    | (activeDoc, saveStatus, shareDoc)  |
                    +------------------------------------+
                                      |
       +------------------------------+------------------------------+
       |                              |                              |
       v                              v                              v
[ Editor Header ]            [ Quill Canvas ]             [ <ShareModal /> ]
(Title, Status Pill,         (HTML/Delta State,           (Collaborators Roster,
 Avatars Stack, Share Btn)    Debounced Autosave)          Invite Input, Role Select)
```

## 5. Architecture
- **Compound State Provider**: `DocumentContext` encapsulates all document lifecycle actions (`updateTitle`, `updateContent`, `saveNow`, `addCollaborator`, `updateCollaboratorRole`, `removeCollaborator`).
- **Reusable Atomic UI Kit**:
  - `Button.jsx`: Variants (`primary`, `secondary`, `danger`, `ghost`, `success`) and loading states.
  - `Modal.jsx`: Accessible modal with backdrop blur and Escape key listener.
  - `Badge.jsx`: Role tags (`Owner`, `Editor`, `Viewer`) and dynamic dot indicators.
  - `Input.jsx`: Standardized text input with validation styling.
  - `Avatar.jsx`: User initials badge with deterministic gradient hashing from username.
- **RESTful Sharing Endpoints**:
  - `POST /api/documents/:id/share`
  - `PATCH /api/documents/:id/collaborators/:userId`
  - `DELETE /api/documents/:id/collaborators/:userId`

## 6. Folder Changes
```
client/src/
├── context/
│   └── DocumentContext.jsx          # Centralized document state & useDocument hook
├── components/
│   ├── ui/
│   │   ├── Button.jsx               # Reusable button with variants & loading state
│   │   ├── Modal.jsx                # Accessible glassmorphism modal
│   │   ├── Badge.jsx                # Role & status badge pills
│   │   ├── Input.jsx                # Form input component
│   │   └── Avatar.jsx               # User avatar with deterministic gradient
│   └── ShareModal.jsx               # Collaborative permissions & invite modal
├── services/
│   └── document.service.js          # Added share, updateRole, removeCollaborator
└── pages/
    └── Editor.jsx                   # Refactored to consume DocumentContext & UI kit

server/src/
├── controllers/
│   └── document.controller.js       # Added share, role update, and remove handlers
└── routes/
    └── document.routes.js           # Registered sharing routes
```

## 7. Database Changes
Leveraged the `Collaborator` model and `Role` enum designed in Sprint 4. No new database migrations were required.

## 8. API Changes
- `POST /api/documents/:id/share`: Accepts `{ email, role }`, returns new collaborator object.
- `PATCH /api/documents/:id/collaborators/:userId`: Accepts `{ role }`, updates role.
- `DELETE /api/documents/:id/collaborators/:userId`: Revokes document access.

## 9. What I Learned
- **Context API vs Redux/Zustand**: When to use React Context (feature-scoped state like an active document session) vs external stores.
- **Custom Hook Encapsulation**: Exposing clean action methods (`addCollaborator`, `saveNow`) from a custom hook (`useDocument`) to keep presentation components declarative.
- **Deterministic Color Hashing**: Generating distinct, consistent avatar gradient pairs from user names/emails without needing backend asset storage.

## 10. Interview Questions
1. **Q**: What are the trade-offs between React Context API and global state management libraries like Redux or Zustand?
   - **A**: Context API is built into React and is ideal for feature-scoped or moderate-frequency state (e.g. Auth, Theme, Active Document Session). However, every consumer of a context re-renders whenever any part of its value changes. Redux and Zustand provide fine-grained selector subscriptions to avoid unnecessary re-renders in large enterprise applications.
2. **Q**: How do you prevent unnecessary re-renders when passing objects and functions through a Context Provider's `value`?
   - **A**: Wrap all exported functions in `useCallback` and memoize the context `value` object with `useMemo` so that consumers only re-render when underlying state dependencies actually change.
3. **Q**: Why is it recommended to throw an error inside a custom hook like `useDocument()` if `useContext(DocumentContext)` returns `null`?
   - **A**: It enforces fail-fast behavior, immediately warning developers if a component attempts to consume document state outside of `<DocumentProvider>`, making debugging straightforward.
4. **Q**: How does Role-Based Access Control (RBAC) differ from Attribute-Based Access Control (ABAC)?
   - **A**: RBAC grants permissions based on static predefined roles (`VIEWER`, `EDITOR`, `ADMIN`). ABAC evaluates dynamic attributes (e.g. user department, time of day, document classification) to make real-time granular authorization decisions.
5. **Q**: How do you implement a "Copy to Clipboard" feature in React with fallback support?
   - **A**: Use the modern asynchronous `navigator.clipboard.writeText(text)` API with a try/catch block. Provide instant visual feedback (e.g. button state transitions from `"Copy Link"` to `"Link Copied!"`) with a 2-second timeout reset.

## 11. Common Mistakes
- **Mutating Context State Directly**: Modifying arrays/objects directly instead of using immutable state updates (`[...prev, newItem]`).
- **Ignoring Self-Sharing**: Forgetting to prevent document owners from inviting their own email address as a collaborator.
- **Missing Keyboard Event Cleanups**: Forgetting to remove global `keydown` listeners (e.g. `Escape` for modals, `Ctrl+S` for save) during component unmounting.

## 12. Best Practices
- **Atomic UI Components**: Create modular, un-opinionated UI primitives (`Button`, `Modal`, `Input`, `Badge`) to maintain unified styling across pages.
- **Optimistic UI Updates**: Update local React context immediately when adding or removing collaborators so the UI feels instantaneous.
- **Accessible Modals**: Always support backdrop clicking, Escape key dismissals, and visible close buttons.

## 13. Homework
- **Coding Exercise 1**: Add an "Only Owner Can Share" toggle in `ShareModal.jsx` allowing the owner to restrict editors from inviting others.
- **Coding Exercise 2**: Add a "Leave Document" button in `ShareModal.jsx` allowing non-owner collaborators to voluntarily remove themselves from a shared document.
- **Conceptual Question 1**: How would you optimize a large React Context provider that frequently updates (e.g., cursor positions moving 60 times per second) without re-rendering the entire document tree?
- **Conceptual Question 2**: What is the difference between shallow equality checking and deep equality checking in React state?
- **Independent Challenge**: Build an "Activity Feed" component inside the document sidebar showing when collaborators were added and who made recent edits.
