# CollabSpace Project Roadmap

This roadmap outlines the milestones and features we will build week-by-week.

---

## 🏃‍♂️ Sprint 0: Project Planning & Environment Setup (Completed)
- [x] Create `ROADMAP.md` and define project timeline
- [x] Create `progress.html` project tracking dashboard
- [x] Setup Server: Initialize Node.js, Express, and Prisma ORM
- [x] Setup Client: Initialize React with Vite and Tailwind CSS
- [x] Verify local API communication (`/api/health`)
- [x] Create Sprint 0 documentation (`Sprint-0.md`)

## 🔒 Sprint 1: Authentication & Authorization (Completed)
- [x] Design Prisma user schema with password hashing
- [x] Implement Register & Login endpoints with JWT
- [x] Set up user validation and error-handling middleware
- [x] Build client-side Auth Context and login/registration pages
- [x] Set up protected route wrappers in React

## 📋 Sprint 2: Dashboard & Document Management (Completed)
- [x] Create Document schema with User relation & CRUD endpoints
- [x] Build frontend Dashboard UI with sidebar, search, and document cards
- [x] Implement Document Creation modal and Delete functionality
- [x] Setup route routing between Dashboard and Document Editor

## 📝 Sprint 3: Rich Text Editor & Document CRUD (Completed)
- [x] Embed a rich text editor library (Quill)
- [x] Build basic editor page UI
- [x] Create document fetch, update, and autosave APIs
- [x] Implement autosave mechanism on the frontend with debouncing

## 💾 Sprint 4: PostgreSQL & Database Schema (Completed)
- [x] Design relational schema with Role enum, Collaborator, & DocumentVersion
- [x] Configure B-Tree database indexing on email, ownerId, and updatedAt
- [x] Create automated database seeding script (`prisma/seed.js`)
- [x] Update controllers to query relational owner, collaborator, and version models

## 🧪 Sprint 5: React State & Custom Contexts (Completed)
- [x] Set up robust state management for document and active sessions (`DocumentContext`)
- [x] Extract UI components into reusable designs (Buttons, Modals, Badges, Inputs, Avatars)
- [x] Build collaborative permissions menu UI (`ShareModal`)
- [x] Implement backend sharing endpoints (`POST /share`, `PATCH role`, `DELETE`)

## ⚡ Sprint 6: Socket.IO Real-time Sync (Completed)
- [x] Set up Socket.IO server on backend with JWT handshake authentication
- [x] Establish Socket.IO connection in frontend editor with reconnection lifecycle
- [x] Implement Room joining logic (room per document ID)
- [x] Synchronize editor contents in real-time between clients with echo-loop prevention

## 👥 Sprint 7: User Presence System (Completed)
- [x] Implement online users indicator bar and presence roster
- [x] Build real-time typing indicators with animated bouncing dots
- [x] Implement collaborative cursor tracking (cursors moving in real-time with name tags)
- [x] Configure automatic cleanup on user disconnection and room departure

## 💬 Sprint 8: Comments & Sharing (Completed)
- [x] Create comment database schemas and API endpoints with Prisma self-relation
- [x] Build editor sidebar for commenting on document highlights (`CommentSidebar`)
- [x] Implement threaded discussion replies and thread resolution status
- [x] Sync comments live over WebSockets with floating highlight triggers

## 📜 Sprint 9: Version History & Restoration (Completed)
- [x] Create document version history database schema with author attribution
- [x] Implement snapshot saving, listing, and preview REST APIs
- [x] Build VersionHistoryDrawer with timeline navigator and read-only preview pane
- [x] Implement point-in-time restoration with automated safety backups and live sync

## 🚀 Sprint 10: Redis Caching & Session Storage (Completed)
- [x] Integrate Redis on the backend with in-memory fallback
- [x] Cache active document structures in Redis with Cache-Aside pattern (<2ms response)
- [x] Implement automated cache invalidation and telemetry stats endpoint
- [x] Configure Redis adapter for Socket.IO horizontal multi-node scaling

## 🔧 Sprint 11: Performance Optimization (Completed)
- [x] Implement code splitting and lazy loading in React (`React.lazy` + `Suspense`)
- [x] Optimize render performance in editor and subcomponents with `React.memo`
- [x] Configure Rollup vendor chunk isolation in `vite.config.js`

## 🧪 Sprint 12: Testing (Completed)
- [x] Write backend API integration tests for Auth, Document CRUD, and Cache-Aside
- [x] Write Comment highlight and threaded discussions integration tests
- [x] Write Version History point-in-time recovery and safety backup tests
- [x] Build multi-client WebSocket connection mocks and real-time sync tests
- [x] Implement master automated test runner (`npm test`) with 100% pass rate

## 🐳 Sprint 13: Docker & Deployment (Completed)
- [x] Dockerize backend with multi-stage Node.js Alpine image & Prisma generation
- [x] Dockerize frontend with Nginx SPA history fallback and gzip compression
- [x] Set up docker-compose.yml for PostgreSQL 16, Redis 7, Server, and Client
- [x] Write GitHub Actions CI/CD workflows (.github/workflows/ci.yml)

## 🎓 Sprint 14: System Design & Interview Preparation (Pending)
- [ ] Conduct overall system design review and scaling architecture summary
- [ ] Prepare technical resume bullet points for CollabSpace
- [ ] Comprehensive mock technical interview covering project architecture
