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

## 🔒 Sprint 1: Authentication & Authorization (Pending)
- [ ] Design Prisma user schema with password hashing
- [ ] Implement Register & Login endpoints with JWT
- [ ] Set up user validation and error-handling middleware
- [ ] Build client-side Auth Context and login/registration pages
- [ ] Set up protected route wrappers in React

## 📋 Sprint 2: Dashboard & Document Management (Pending)
- [ ] Create mock document list database endpoints
- [ ] Build frontend Dashboard UI with sidebar, search, and document cards
- [ ] Implement Document Creation modal and Delete functionality
- [ ] Setup route routing between Dashboard and Document Editor

## 📝 Sprint 3: Rich Text Editor & Document CRUD (Pending)
- [ ] Embed a rich text editor library (e.g., Quill or Slate.js)
- [ ] Build basic editor page UI
- [ ] Create document fetch, update, and autosave APIs
- [ ] Implement autosave mechanism on the frontend with debouncing

## 💾 Sprint 4: PostgreSQL & Database Schema (Pending)
- [ ] Connect Prisma to local PostgreSQL database
- [ ] Run migrations for User, Document, and Collaborator schemas
- [ ] Refactor auth and document APIs to use database models
- [ ] Seed database with initial sample data

## 🧪 Sprint 5: React State & Custom Contexts (Pending)
- [ ] Set up robust state management for document and active sessions
- [ ] Extract UI components into reusable designs (Buttons, Inputs, Modals)
- [ ] Build collaborative permissions menu UI (Share modal)

## ⚡ Sprint 6: Socket.IO Real-time Sync (Pending)
- [ ] Set up Socket.IO server on backend
- [ ] Establish Socket.IO connection in frontend editor
- [ ] Implement Room joining logic (room per document ID)
- [ ] Synchronize editor contents in real-time between clients

## 👥 Sprint 7: User Presence System (Pending)
- [ ] Implement online users indicator bar
- [ ] Build real-time typing indicators
- [ ] Implement collaborative cursor tracking (cursors moving in real-time)

## 💬 Sprint 8: Comments & Sharing (Pending)
- [ ] Create comment database schemas and API endpoints
- [ ] Build editor sidebar for commenting on document highlights
- [ ] Create document-level permissions (View-only, Can Edit)

## 📜 Sprint 9: Version History & Restoration (Pending)
- [ ] Create document version history database schema
- [ ] Implement snapshot saving endpoint
- [ ] Build version panel UI in frontend for viewing and restoring history

## 🚀 Sprint 10: Redis Caching & Session Storage (Pending)
- [ ] Integrate Redis on the backend
- [ ] Cache active document structures in Redis for fast updates
- [ ] Implement Redis adapter for Socket.IO horizontal scaling

## 🔧 Sprint 11: Performance Optimization (Pending)
- [ ] Implement code splitting and lazy loading in React
- [ ] Optimize render performance in the editor (preventing unnecessary typing lags)
- [ ] Implement efficient database queries and indexing

## 🧪 Sprint 12: Testing (Pending)
- [ ] Write backend API unit and integration tests
- [ ] Set up frontend component testing
- [ ] Write WebSocket connection mocks and sync flow tests

## 🐳 Sprint 13: Docker & Deployment (Pending)
- [ ] Dockerize backend and frontend applications
- [ ] Set up docker-compose for PostgreSQL, Redis, and APIs
- [ ] Write basic Github Actions CI/CD workflows

## 🎓 Sprint 14: System Design & Interview Preparation (Pending)
- [ ] Conduct overall system design review and scaling exercises
- [ ] Prepare technical resume bullet points for CollabSpace
- [ ] Conduct mock technical interview covering project details
