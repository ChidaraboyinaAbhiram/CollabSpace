# 🐳 Sprint 13: Docker & Deployment

## 📌 Sprint Goal
Containerize all tiers of CollabSpace (Client SPA with Nginx, Backend API with Node.js & Prisma, PostgreSQL 16 database, and Redis 7 in-memory cache) using **Multi-Stage Dockerfiles**, orchestrate them through **`docker-compose.yml`**, and implement an automated **GitHub Actions CI/CD Pipeline**.

---

## 🏗️ Containerization & CI/CD Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           docker-compose.yml                            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
    ┌─────────────────┬──────────────┴──────┬──────────────────┐
    │                 │                     │                  │
    ▼                 ▼                     ▼                  ▼
┌──────────────┐┌──────────────┐   ┌─────────────────┐ ┌───────────────┐
│ Client (SPA) ││ Backend API  │   │  PostgreSQL 16  │ │    Redis 7    │
│ Nginx:Alpine ││ Node 20 Multi│   │ Relational Data │ │ In-Memory TTL │
│  (Port 80)   ││  (Port 5000) │   │   (Port 5432)   │ │  (Port 6379)  │
└──────────────┘└──────┬───────┘   └────────┬────────┘ └───────┬───────┘
                       │                    │                  │
                       └────────────────────┴──────────────────┘
                               Bridge Network (collabspace_net)
```

---

## 🛠️ Files Created & Configured

### 1. `server/Dockerfile` & `server/.dockerignore`
- Multi-stage build (`builder` -> `runner`).
- Stage 1: Installs dependencies and runs `npx prisma generate`.
- Stage 2: Copies only production assets to a minimal `node:20-alpine` image to minimize CVE attack surface.

### 2. `client/Dockerfile`, `client/nginx.conf`, & `client/.dockerignore`
- Multi-stage build (`builder` -> `runner`).
- Stage 1: Compiles Vite React code into optimized production chunks (`dist/`).
- Stage 2: Injects assets into `nginx:alpine`, with gzip compression, asset caching headers, SPA route fallback (`try_files $uri $uri/ /index.html`), and reverse-proxying `/api/` & `/socket.io/` to backend.

### 3. `docker-compose.yml`
- Declares 4 isolated services: `postgres`, `redis`, `server`, and `client`.
- Includes healthcheck dependencies (`condition: service_healthy`) ensuring backend boots only when PostgreSQL & Redis are ready.
- Persistent volume mounts for data retention (`postgres_data`, `redis_data`).

### 4. `.github/workflows/ci.yml`
- Automated CI matrix on every push/pull-request to `main`.
- Boots containerized PostgreSQL & Redis service containers in the GitHub runner.
- Pushes Prisma schema and runs the 48-test integration suite (`npm test`).
- Verifies frontend production bundle compilation (`npm run build`).

---

## 🚀 How to Run with Docker Compose

```bash
# Start all 4 services in detached mode
docker-compose up -d --build

# Inspect running containers
docker-compose ps

# View live consolidated logs
docker-compose logs -f
```

---

## 🎯 Key Takeaways for Senior Engineering Interviews
1. **Multi-Stage Docker Builds**: By separating the build environment (Node build tools, compilers) from the runtime environment (minimal Alpine Linux), we reduce image size from ~1GB to <100MB and exclude dev dependencies.
2. **Nginx SPA History API Fallback**: Single Page Applications handle routing client-side via React Router. Without `try_files $uri $uri/ /index.html`, refreshing `/document/123` returns a 404 error from Nginx.
3. **Docker Compose Healthchecks**: Setting `condition: service_healthy` avoids race conditions where Node.js attempts connecting to database before PostgreSQL completes its startup sequence.
