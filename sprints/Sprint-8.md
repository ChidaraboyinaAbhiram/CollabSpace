# Sprint 8 Documentation: Comments & Document Highlights

## 1. Goal
The goal of Sprint 8 is to build a collaborative commenting and highlight thread system for CollabSpace, allowing users to select text in the editor, create anchored comments, reply to discussion threads, resolve completed reviews, and sync comments live across collaborators via WebSockets.

## 2. Problem Statement
Collaborative document authoring requires contextual feedback loops where reviewers can leave questions and suggestions tied directly to specific phrases without altering the actual document content.

## 3. Why We Need This Feature
In tools like Google Docs and Notion:
- Comment threads keep editorial discussions organized and contextualized.
- Thread replies preserve multi-user conversations without cluttering the document body.
- Resolution workflows enable teams to mark completed edits and archive discussions.
- Real-time comment notifications update peers instantly when feedback is left.

## 4. Workflow
1. **Text Selection**: A user selects text in Quill. The editor detects `range.length > 0` and renders a floating `"💬 Comment"` button anchored directly above the highlighted words.
2. **Comment Submission**: Clicking the button opens `<CommentSidebar />` prefilled with the highlighted text snippet. Submitting the form calls `POST /api/documents/:id/comments`.
3. **Database Persistence**: The server stores the `Comment` record linked to `documentId`, `authorId`, `highlightedText`, `startIndex`, and `endIndex`.
4. **WebSocket Broadcast**: The client emits `new-comment` over Socket.IO, broadcasting `comment-added` to all collaborators in the document room.
5. **Thread Replies**: Collaborators can reply to any active thread via `POST /api/documents/:id/comments` with `parentId: comment.id`.
6. **Resolution & Archival**: Users can mark threads as resolved (`PATCH /api/documents/:id/comments/:id/resolve`), moving them to the "Resolved" tab in the sidebar.

```
[ User Highlights Text in Editor ]
                |
                v
[ Floating "💬 Comment" Tooltip Appears ]
                | (User clicks & enters comment)
                v
[ POST /api/documents/:id/comments ]
                |
     +----------+----------+
     |                     |
[ Backend Saves DB ]   [ Socket Broadcasts "comment-added" ]
     |                     |
     v                     v
[ Comment appears in Sidebar & count badge increments in real time ]
```

## 5. Architecture
- **Prisma Self-Relation for Nested Threads**: The `Comment` model utilizes a self-referencing 1-to-many relation (`parentId` -> `parent Comment`, `replies Comment[]`) to support hierarchical discussion trees.
- **REST + WebSocket Hybrid Flow**: Comments and replies are persisted durably via authenticated REST endpoints and instantly broadcasted to active room peers via Socket.IO.
- **Floating Contextual Anchors**: Calculates character bounding boxes dynamically using `quill.getBounds()` to float the comment action button above the user's cursor selection.
- **Role-Based Comment Deletion**: Restricts comment deletion to either the original comment author or the document owner.

## 6. Folder Changes
```
server/
├── prisma/
│   └── schema.prisma                # Added Comment model with self-relation for replies
├── src/
│   ├── controllers/
│   │   └── comment.controller.js    # Create, list, resolve, and delete comment handlers
│   ├── routes/
│   │   ├── comment.routes.js        # Mounted comment endpoints
│   │   └── document.routes.js       # Attached /:id/comments sub-route
│   └── socket/
│       └── socket.server.js         # Real-time comment events (comment-added, comment-resolved, comment-deleted)

client/src/
├── components/
│   ├── CommentSidebar.jsx           # Collapsible sliding comment panel with Active/Resolved tabs
│   └── CommentCard.jsx              # Comment thread card with replies and resolve checkbox
├── services/
│   └── comment.service.js           # Comment API client service
└── pages/
    └── Editor.jsx                    # Bound floating highlight button, sidebar toggle, and live count badge
```

## 7. Database Changes
- **`Comment` Model**:
  - `id`: `String` (UUID primary key)
  - `content`: `String`
  - `highlightedText`: `String?`
  - `startIndex`: `Int?`
  - `endIndex`: `Int?`
  - `resolved`: `Boolean` (`@default(false)`)
  - `documentId`: `String` (foreign key -> `Document.id` with `onDelete: Cascade`)
  - `authorId`: `String` (foreign key -> `User.id` with `onDelete: Cascade`)
  - `parentId`: `String?` (foreign key -> `Comment.id` self-relation with `onDelete: Cascade`)
  - Indexes configured on `[documentId]`, `[authorId]`, and `[parentId]`.

## 8. API & WebSocket Specifications
- `POST /api/documents/:id/comments`: `{ content, highlightedText, startIndex, endIndex, parentId }`
- `GET /api/documents/:id/comments`: Returns nested comment trees with author metadata.
- `PATCH /api/documents/:id/comments/:commentId/resolve`: `{ resolved: Boolean }`
- `DELETE /api/documents/:id/comments/:commentId`: Deletes comment and nested replies.
- WebSocket Events: `new-comment` -> `comment-added`, `resolve-comment` -> `comment-resolved`, `delete-comment` -> `comment-deleted`.

## 9. What I Learned
- **Prisma Self-Relations**: Implementing recursive 1-to-many parent/child tree hierarchies within a single relational table.
- **Anchoring Highlights to Range Bounds**: Using `quill.getBounds(range.index, range.length)` to position floating context toolbars above user selections.
- **Cascade Deletions in Tree Structures**: Configuring `onDelete: Cascade` on the self-relation so that deleting a parent comment automatically deletes all nested replies.

## 10. Interview Questions
1. **Q**: How do you design a relational database schema for nested comment threads and replies? What are the trade-offs of self-referencing foreign keys vs Materialized Paths (Closure Tables)?
   - **A**: Self-referencing foreign keys (`parentId` -> `Comment.id`) are simple and efficient for shallow trees (1-2 levels of replies). For deeply nested recursive comment trees (like Reddit), **Closure Tables** or **Materialized Path** (`path = "1/4/12"`) allow querying an entire subtree in a single non-recursive query.
2. **Q**: How do you keep comment highlight positions in sync when text is added or deleted before the highlighted character range?
   - **A**: Operational Transformation (OT) or Delta index shifting updates the `startIndex` and `endIndex` of existing comments whenever text is inserted or removed before the comment offset.
3. **Q**: Why is `mergeParams: true` required in Express when mounting nested routers (e.g. `router.use('/:id/comments', commentRoutes)`)?
   - **A**: By default, Express child routers cannot access route parameters defined in the parent router (`:id`). Setting `{ mergeParams: true }` preserves parent parameters so `req.params.id` (documentId) is accessible inside comment handlers.
4. **Q**: How do you ensure that only authorized users (the comment author or the document owner) can delete a comment?
   - **A**: Query the comment including its parent document; check if `req.user.id === comment.authorId || req.user.id === comment.document.ownerId` before executing the deletion query.
5. **Q**: What are the performance advantages of separating real-time comment synchronization events from full document text broadcasts?
   - **A**: Comments are distinct contextual entities. Broadcasting discrete `comment-added` events prevents unnecessary re-rendering of the entire Quill editor and eliminates network bandwidth bloat.

## 11. Common Mistakes
- **Orphaned Replies**: Deleting a parent comment without cascading, leaving child replies pointing to non-existent parent IDs.
- **Losing Highlight Anchors on Selection Click**: Dismissing text selection when the user attempts to click the floating comment button; solved by checking click event targets.
- **Unindexed Foreign Keys**: Forgetting to add `@@index([parentId])` and `@@index([documentId])` in Prisma, leading to sequential table scans when loading document comments.

## 12. Best Practices
- **Eager Loading Author Profiles**: Always select user names and emails when fetching comment trees to eliminate N+1 database queries.
- **Optimistic UI Updates**: Instantly prepend newly submitted comments to the sidebar list while the network request resolves in the background.
- **Visual Distinction for Resolved Threads**: Dim resolved comments and group them in a dedicated tab to maintain a clean workspace.

## 13. Homework
- **Coding Exercise 1**: Add an `@mention` auto-complete popup inside `CommentCard.jsx` when typing `@` to tag collaborators.
- **Coding Exercise 2**: Add an email or in-app notification when a teammate replies to your comment thread.
- **Conceptual Question 1**: How would you implement real-time collaborative suggestions (like Google Docs "Suggesting Mode") using comment data models?
- **Conceptual Question 2**: What caching strategy (e.g., Redis hashes) would you use to cache comment counts and recent activity on the dashboard?
- **Independent Challenge**: Build an inline yellow highlight in the Quill editor body that highlights comment text ranges and scrolls the sidebar to the corresponding comment card when clicked.
