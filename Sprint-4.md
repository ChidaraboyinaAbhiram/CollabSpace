# Sprint 4 Documentation: PostgreSQL Integration & Database Design

## 1. Goal
The goal of Sprint 4 is to build the comprehensive relational database schema in Prisma ORM, configure Role-Based Access Control (RBAC) permissions, set up document version history models, create database B-Tree indexes, and build an automated database seeding script.

## 2. Problem Statement
In earlier iterations, data stores lacked relational constraints, access-control models, and version tracking entities. Without database indexes, full table scans on millions of documents would cause server bottlenecks and high query latency.

## 3. Why We Need This Feature
In production systems:
- Relational integrity ensures no orphaned collaborators or documents exist.
- Indexing on `ownerId`, `email`, and `updatedAt` reduces query lookup complexity from $O(N)$ to $O(\log N)$.
- Automated seeding scripts (`seed.js`) allow developers to spin up consistent local staging environments with sample accounts, documents, and roles in seconds.

## 4. Workflow
1. **Schema Definition**: Define entities in `schema.prisma` (`User`, `Document`, `Collaborator`, `DocumentVersion`).
2. **Type Generation**: `npx prisma generate` compiles schema models into strongly-typed JavaScript database clients.
3. **Database Seeding**: Running `npm run seed` executes `prisma/seed.js`, clearing old fixtures and creating demo accounts with bcrypt password hashes and rich text documents.
4. **Relational Querying**: Controllers use Prisma `include` to fetch documents alongside nested owner profiles, collaborator permissions, and historical snapshots.

```
+------------------------------------+
|               User                 |
+------------------------------------+
| id          : UUID (PK)            |
| name        : String               |
| email       : String (Unique, Idx) |
| password    : String (Hashed)      |
+------------------------------------+
       | 1                    | 1
       | (owns)               | (has)
       v N                    v N
+------------------------------------+       +------------------------------------+
|             Document               | 1   N |            Collaborator            |
+------------------------------------+<------| (Join Table / RBAC Permissions)    |
| id          : UUID (PK)            |       +------------------------------------+
| title       : String               |       | id         : UUID (PK)             |
| content     : String (HTML/Delta)  |       | role       : Enum(VIEWER, EDITOR)  |
| icon        : String               |       | userId     : UUID (FK, Idx)        |
| ownerId     : UUID (FK, Idx)       |       | documentId : UUID (FK, Idx)        |
| updatedAt   : DateTime (Idx)       |       +------------------------------------+
+------------------------------------+
       | 1
       | (has history)
       v N
+------------------------------------+
|          DocumentVersion           |
+------------------------------------+
| id          : UUID (PK)            |
| title       : String               |
| content     : String               |
| documentId  : UUID (FK, Idx)       |
+------------------------------------+
```

## 5. Architecture
- **Role-Based Access Control (RBAC)**: `Role` enum with `VIEWER`, `EDITOR`, and `ADMIN` permissions stored on the `Collaborator` join table.
- **Cascade Deletions**: Deleting a `Document` automatically purges all associated `Collaborator` and `DocumentVersion` records.
- **B-Tree Database Indexing**:
  - `@@index([email])` on `User` for instant login queries.
  - `@@index([ownerId])` and `@@index([updatedAt])` on `Document` for fast dashboard sorting.
  - `@@index([userId])` and `@@index([documentId])` on `Collaborator` for rapid permission validation.

## 6. Folder Changes
```
server/
├── prisma/
│   ├── schema.prisma                # Complete production schema with RBAC & Versions
│   └── seed.js                      # Database seeding script
├── package.json                     # Added "seed" npm script
├── src/
│   ├── config/
│   │   └── db.js                    # Enhanced Prisma singleton client
│   └── controllers/
│       └── document.controller.js   # Nested relations for owners & collaborators
```

## 7. Database Changes
Updated `server/prisma/schema.prisma` with:
- `enum Role`: `VIEWER`, `EDITOR`, `ADMIN`.
- `model User`: Added `documents` and `collaborations` relations.
- `model Document`: Added `owner`, `collaborators`, `versions` relations and indexes.
- `model Collaborator`: Added `@@unique([userId, documentId])` and indexes.
- `model DocumentVersion`: Added `documentId` foreign key and index.

## 8. API Changes
- Enhanced `GET /api/documents` to retrieve both owned documents and collaborated workspaces.
- Enhanced `GET /api/documents/:id` to include nested `owner`, `collaborators`, and recent `versions`.
- Enhanced `PUT /api/documents/:id` with optional `createSnapshot: true` to record historical version milestones.

## 9. What I Learned
- **Prisma Relations & Join Tables**: Building many-to-many relationships with explicit join models (`Collaborator`).
- **Composite Unique Keys**: Enforcing that a user can only have one permission record per document using `@@unique([userId, documentId])`.
- **B-Tree Indexing Mechanics**: How database indexes speed up `WHERE` filtering and `ORDER BY` operations.

## 10. Interview Questions
1. **Q**: What is the difference between an Implicit and Explicit Many-to-Many relationship in Prisma?
   - **A**: An implicit relation lets Prisma manage a hidden join table automatically. An explicit relation (like our `Collaborator` model) defines a dedicated model, allowing you to store additional metadata on the join table (e.g. `role`, `createdAt`, `invitedBy`).
2. **Q**: What is the purpose of database indexing, and what are the trade-offs of adding too many indexes?
   - **A**: Indexes create balanced search trees (B-Trees) to speed up `SELECT` and `WHERE` queries ($O(\log N)$ instead of $O(N)$). However, every `INSERT`, `UPDATE`, and `DELETE` must also update all existing indexes, slowing down write throughput and consuming extra disk storage.
3. **Q**: What is a composite unique constraint, and why did we use `@@unique([userId, documentId])`?
   - **A**: It ensures that the combination of multiple columns is unique across the table. This guarantees a user cannot be added twice to the same document with conflicting permissions.
4. **Q**: How does Connection Pooling work in Node.js and PostgreSQL?
   - **A**: Opening and closing TCP connections to a database is expensive. A connection pool maintains a cache of open, reusable database connections that can be borrowed by incoming API requests and returned upon query completion.
5. **Q**: What are database migrations, and why are they committed to Git?
   - **A**: Migrations are version-controlled SQL scripts describing exact schema evolutions over time. Committing them ensures all developers and production environments apply the exact same database transformations in a predictable order.

## 11. Common Mistakes
- **Missing Foreign Key Indexes**: Forgetting to index foreign key columns (`ownerId`, `documentId`), leading to slow join operations.
- **N+1 Query Problem**: Fetching a list of documents and then making individual database queries in a loop to fetch each owner. Always use eager loading (Prisma `include: { owner: true }`).
- **Hardcoding Database Credentials**: Never commit database passwords; always use `DATABASE_URL` in `.env`.

## 12. Best Practices
- **Seed Scripts**: Always maintain realistic database seed scripts so new team members can set up local testing environments in one command (`npm run seed`).
- **Enums for Restricted States**: Use database Enums (e.g. `enum Role`) rather than generic string fields to enforce strict type constraints at the database level.
- **Transactional Consistency**: Wrap multiple dependent database writes in transactions (`prisma.$transaction`) to prevent partial failures.

## 13. Homework
- **Coding Exercise 1**: Write a helper function in `seed.js` that generates 5 sample document versions for a document with timestamps 10 minutes apart.
- **Coding Exercise 2**: Add an `isFavorite: Boolean @default(false)` column to `Document` in `schema.prisma` and regenerate Prisma client.
- **Conceptual Question 1**: How does PostgreSQL's Multi-Version Concurrency Control (MVCC) allow simultaneous reads and writes without locking tables?
- **Conceptual Question 2**: When should you partition a PostgreSQL table (e.g., partitioning `DocumentVersion` by month/year)?
- **Independent Challenge**: Write a custom query in `document.controller.js` that fetches documents shared with the user where `role === 'EDITOR'`.
