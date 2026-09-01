# Sprint 2 Documentation: Dashboard & Document Management

## 1. Goal
The goal of Sprint 2 is to design and build an interactive workspace dashboard where users can view, search, create, and delete documents, supported by backend CRUD API endpoints and relational Prisma database models.

## 2. Problem Statement
Authentication (Sprint 1) established user identity, but without a document management dashboard, users have no place to organize workspaces, initiate new collaborative notes, or search through existing files.

## 3. Why We Need This Feature
In applications like Google Docs and Notion:
- The dashboard is the primary home screen upon login.
- Users need quick search capabilities to find documents among dozens of workspaces.
- Document ownership must be established so that document creators can manage permissions and deletions.

## 4. Workflow
1. **Fetch Workspaces**: On mounting `/dashboard`, React invokes `fetchDocuments()`.
2. **Authenticate & Filter**: Backend verifies JWT token in `Authorization: Bearer <token>`, queries Prisma where `ownerId === req.user.id`, and returns documents array.
3. **Live Search**: As the user types into the search bar, the UI dynamically filters document cards in real-time.
4. **Create Document**: User clicks "+ New", opens `<CreateDocModal>`, selects an emoji icon and title, and submits. Backend saves new document with default blank content.
5. **Delete Document**: User clicks the trash icon on a card, confirms in `<DeleteDocModal>`, and backend verifies ownership before removing the record.

```
[ User on Dashboard ] ---> (GET /api/documents + JWT) ---> [ Express Server ]
                                                                 |
                                                     (Query docs WHERE ownerId = user.id)
                                                                 v
[ Render Document Cards Grid ] <----------------- (Returns documents array)
```

## 5. Architecture
- **Relational Data Modeling**: 1-to-many relationship where one `User` can own multiple `Document` instances (`onDelete: Cascade`).
- **RESTful Endpoints**: Standard HTTP verbs (`POST`, `GET`, `DELETE`) mapping to document resources.
- **Component Decomposition**: Clean separation between `Sidebar`, `DocumentCard`, `CreateDocModal`, `DeleteDocModal`, and `document.service.js`.

## 6. Folder Changes
```
server/
├── prisma/
│   └── schema.prisma                   # Added Document model with User relation
├── src/
│   ├── controllers/
│   │   └── document.controller.js      # Create, list, getById, delete handlers
│   ├── routes/
│   │   └── document.routes.js          # Protected document routes
│   └── server.js                       # Mounted /api/documents

client/
├── src/
│   ├── services/
│   │   └── document.service.js         # Document API client
│   ├── components/
│   │   ├── Sidebar.jsx                 # Dashboard sidebar navigation
│   │   ├── DocumentCard.jsx            # Interactive document card
│   │   ├── CreateDocModal.jsx          # New document creation modal
│   │   └── DeleteDocModal.jsx          # Delete confirmation modal
│   └── pages/
│       └── Dashboard.jsx               # Main workspace dashboard UI
```

## 7. Database Changes
Added the `Document` model in `server/prisma/schema.prisma`:
```prisma
model Document {
  id        String   @id @default(uuid())
  title     String   @default("Untitled Document")
  content   String?  @default("")
  icon      String?  @default("📄")
  ownerId   String
  owner     User     @relation("UserDocuments", fields: [ownerId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 8. API Changes
- `POST /api/documents`: Creates a new document.
- `GET /api/documents`: Retrieves all documents owned by the user.
- `GET /api/documents/:id`: Retrieves single document metadata.
- `DELETE /api/documents/:id`: Deletes a document owned by the user.

## 9. What I Learned
- **Relational Schema Design in Prisma**: Linking models using foreign keys (`ownerId`) and cascade rules.
- **Optimistic State Updates**: Updating React state immediately upon document creation and deletion.
- **Modal Lifecycle in React**: Managing modal open/close states and confirmation payloads.
- **Defensive Ownership Verification**: Ensuring users cannot delete or access documents owned by other users.

## 10. Interview Questions
1. **Q**: What does `onDelete: Cascade` mean in relational database design?
   - **A**: It ensures that when a parent record (e.g. a `User`) is deleted, all associated child records (e.g. all `Documents` created by that user) are automatically deleted by the database, preventing orphaned records.
2. **Q**: How would you optimize the `GET /api/documents` query when a user has thousands of documents?
   - **A**: Implement **Pagination** (using `limit` and `cursor`/`offset` in SQL/Prisma) and database **Indexing** on the foreign key column (`ownerId`) and sorting column (`updatedAt DESC`).
3. **Q**: Why is it important to perform authorization checks on `DELETE /api/documents/:id` on the server even if the delete button is hidden in the frontend UI?
   - **A**: Frontend UI restrictions can easily be bypassed using tools like curl or Postman. The server must always independently verify `doc.ownerId === req.user.id` before executing destructive database actions.
4. **Q**: What is the difference between client-side search filtering and server-side search filtering? When should you use which?
   - **A**: Client-side filtering searches across records already loaded in React state (instant, 0 network latency, great for <100 items). Server-side filtering sends search queries (`?q=term`) to the backend using SQL `LIKE`/full-text search (essential for large datasets with pagination).
5. **Q**: How does debouncing help when implementing a live search input?
   - **A**: Debouncing delays query execution until the user stops typing for a set interval (e.g. 300ms), preventing hundreds of unnecessary re-renders or API calls on every keystroke.

## 11. Common Mistakes
- **Missing Ownership Checks**: Allowing any logged-in user to delete any document ID passed in the URL.
- **Unescaped Search Queries**: Forgetting to handle special characters or case-insensitivity when filtering document titles.
- **Blocking Modals**: Not disabling submit buttons during in-flight network requests, leading to duplicate document creation on double-clicks.

## 12. Best Practices
- **Sanitize Default Values**: Provide fallback defaults (`"Untitled Document"`, `"📄"`) so documents always have consistent display attributes.
- **Confirmation Dialogs for Destructive Actions**: Always show a confirmation prompt before permanently deleting documents.
- **Clean API Layering**: Keep fetch logic inside dedicated service files (`document.service.js`) instead of inlining `fetch()` inside React components.

## 13. Homework
- **Coding Exercise 1**: Add a "Sort By" dropdown on the Dashboard (sorting by "Recently Updated", "Alphabetical (A-Z)", and "Creation Date").
- **Coding Exercise 2**: Add a "Duplicate Document" button on `DocumentCard.jsx` that clones an existing document with the title `"Copy of [Original Title]"`.
- **Conceptual Question 1**: How would you implement a "Trash / Recently Deleted" soft-delete mechanism instead of permanently dropping records with `DELETE`?
- **Conceptual Question 2**: Why should document content (which could be megabytes of rich text) be excluded when fetching lightweight document lists for the dashboard grid?
- **Independent Challenge**: Build a "Rename Document" inline edit feature on the document card, calling a new `PATCH /api/documents/:id` endpoint to update the title.
