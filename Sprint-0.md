# Sprint 0 Documentation: Project Planning & Environment Scaffolding

## 1. Goal
The primary goal of Sprint 0 is to plan, design, and scaffold the foundational workspace environment for **CollabSpace**, a real-time collaborative document editor. This includes mapping out the system architecture, establishing the directory structure (monorepo format), and bootstrapping both the React frontend and Node.js backend.

## 2. Problem Statement
Building a real-time document editor (like Google Docs or Notion) requires solving complex synchronization and scaling problems. Starting directly with writing code without setting up proper scaffolding, environment variables, dependencies, and architectural bounds leads to:
- Code duplication between frontend and backend.
- Rigid systems that are hard to split across multiple server nodes.
- Circular dependency issues and messy project folders.
- Inconsistent package versions.

## 3. Why We Need This Feature
Before building advanced collaborative editors, databases, or JWT systems, we need a baseline workspace where the client application and server application can communicate seamlessly over HTTP. Scaffolded directories and a clear system plan ensure that each subsequent week's sprint can be integrated with minimal overhead.

## 4. Workflow
During Sprint 0, the workflow is establishing a client-server connection tester:
1. The developer boots the backend server using `npm run dev`.
2. The developer boots the client server using `npm run dev`.
3. The React client makes an asynchronous `GET` request using `fetch()` to `http://localhost:5000/api/health`.
4. The backend Express server responds with a JSON success payload containing the server status and timestamps.
5. The React client receives and displays this health data inside a structured card, indicating that client-server HTTP communication is fully verified.

```
+---------------+                   HTTP GET                     +------------------+
|               | ------------ /api/health ------------> |                  |
| React Client  |                                        |  Express Server  |
|               | <------------ JSON Status ------------- |                  |
+---------------+                                        +------------------+
```

## 5. Architecture
CollabSpace will use a service-oriented architectural model partitioned into a frontend client and a backend server:
- **Presentation Layer (Client)**: React.js served by Vite, styled using Tailwind CSS. Consumes REST endpoints and establishes a persistent duplex WebSocket channel for real-time document streams.
- **API & Routing Layer (Server)**: Node.js with Express.js handles JWT authentication, HTTP route processing, and WebSocket room management.
- **Data Access & Caching Layer**: Prisma ORM acts as the bridge to PostgreSQL. Redis serves as an in-memory session and active-document cache to reduce database load.

```
                          [ Client Browser ]
                                  |
            +---------------------+---------------------+
            | (REST HTTP)                               | (WebSockets)
            v                                           v
[ Node.js/Express API ]                        [ Socket.IO Engine ]
            |                                           |
            +---------------------+---------------------+
                                  |
            +---------------------+---------------------+
            | (Prisma ORM)                              | (Redis client)
            v                                           v
    [ PostgreSQL DB ]                             [ Redis Cache ]
```

## 6. Folder Changes
The project structure has been scaffolded as follows:
```
CollabSpace/
├── client/                      # React Frontend
│   ├── src/
│   │   ├── App.jsx              # Main dashboard component
│   │   ├── index.css            # Tailwind CSS main file
│   │   └── main.jsx             # React DOM renderer
│   ├── tailwind.config.js       # Tailwind configuration file
│   ├── postcss.config.js        # PostCSS configuration file
│   ├── vite.config.js           # Vite build tool config
│   └── package.json             # Frontend dependency configuration
├── server/                      # Node.js Backend
│   ├── prisma/
│   │   └── schema.prisma        # Prisma engine configuration
│   ├── src/
│   │   └── server.js            # Express application setup
│   ├── .env                     # Local environment settings
│   ├── .env.example             # Local environment variables blueprint
│   └── package.json             # Backend dependency configuration
├── ROADMAP.md                   # Sprints tracking file
└── progress.html                # Project progress visual dashboard
```

## 7. Database Changes
No active database tables were created in Sprint 0. However, **Prisma ORM** has been initialized in the backend directory:
- `server/prisma/schema.prisma` configures the database connector to PostgreSQL and loads the `DATABASE_URL` dynamic environment variable.
- In Sprint 4, we will run Prisma migrations to build user and document schemas.

## 8. API Changes
We introduced our first REST endpoint:

### `GET /api/health`
- **Request Body**: None
- **Response Format**: `application/json`
- **Response Status**: `200 OK`
- **Response Payload**:
  ```json
  {
    "status": "success",
    "message": "CollabSpace Backend is running smoothly",
    "timestamp": "2026-06-30T13:17:45.211Z"
  }
  ```

## 9. Frontend Flow
1. **Bootstrap**: Vite loads `client/index.html`.
2. **Mount**: `client/src/main.jsx` runs and mounts the `<App />` component in the HTML shell root.
3. **Effect hook**: The `useEffect` hook in `App.jsx` triggers when the component mounts and invokes the `checkBackendHealth` async function.
4. **State updates**: The app triggers a loading animation, fetches `/api/health`, and updates state variables for either data or error messages.
5. **Render**: The dashboard renders a card detailing connection success (green) or failure (red).

## 10. Backend Flow
1. **Initialize**: Node executes `server/src/server.js` (loaded via nodemon in dev mode).
2. **Configure**: Express mounts CORS middleware allowing incoming headers from `http://localhost:5173`.
3. **Route Match**: When an incoming request pings `/api/health`, the route callback is fired.
4. **Respond**: The controller construct responds with a `200` status payload containing server success status and system timestamps.

## 11. What I Learned
- **Monorepo setup**: Managing separate client and server subdirectories inside a single parent repository.
- **Vite compilation**: Understanding why Vite compiles faster than Create React App (using esbuild and native browser ESM).
- **Prisma initialization**: Bootstrapping an ORM layer that decouples data management from SQL query writing.
- **CORS mechanism**: Learning how the Cross-Origin Resource Sharing security mechanism guards APIs from malicious requests originating from unauthorized domains.

## 12. Interview Questions
1. **Q**: What is the difference between client-side rendering (CSR) and server-side rendering (SSR)?
   - **A**: CSR (like React Vite defaults) downloads a minimal HTML shell and leverages JavaScript to build the DOM directly in the user's browser. SSR (like Next.js) builds the complete HTML structure on the server and pushes ready-to-display layout code to the client. CSR is fast once loaded, while SSR offers better SEO out-of-the-box.
2. **Q**: Why do we use cross-origin resource sharing (CORS) configurations on backend servers?
   - **A**: By default, web browsers block frontend code from reading HTTP responses from a domain other than the one that served the page. CORS allows backend services to specify which origins (e.g. `http://localhost:5173`) are explicitly permitted to read and send request credentials (like JWTs in cookies).
3. **Q**: Explain the role of an ORM like Prisma in a modern backend system.
   - **A**: An Object-Relational Mapper (ORM) maps database tables to object-oriented structures in code. It provides auto-generated database clients with type-safety, handles migration files, and allows developers to write code-based database updates instead of raw SQL queries.
4. **Q**: What are the advantages of using Vite over Create React App (CRA)?
   - **A**: CRA uses Webpack, which bundles the entire application before starting the dev server. Vite leverages native ES Modules (ESM) in the browser, compiling only what is currently loaded, and uses esbuild (written in Go) to pre-bundle dependencies, making startup and hot module replacement (HMR) virtually instant.
5. **Q**: Why is it important to use environment variables (`.env`) instead of hardcoding database credentials?
   - **A**: Hardcoded credentials checked into repository tracking systems expose databases to security breaches. Environment variables allow different settings (dev database URLs vs. production database URLs) to be loaded dynamically depending on where the code is executing without modifying the codebase.

## 13. Common Mistakes
- **CORS Misconfiguration**: Forgetting to update the `CLIENT_URL` in the `.env` file, which leads to frontend fetches throwing a blocked-by-CORS error in the browser.
- **Port Clashing**: Attempting to run both the React client and Express server on the same port (e.g. 5000), which triggers a `EADDRINUSE` error.
- **Pushing `.env` to Git**: Accidentally committing `.env` files with secret database passwords. Always include `.env` in the `.gitignore` list and provide a safe `.env.example` file instead.

## 14. Best Practices
- **Explicit API Versioning**: Prefix endpoints with `/api` or `/api/v1` to allow scaling endpoints in the future without breaking existing clients.
- **Defensive Environment Validation**: Validate that required environment variables (e.g. `JWT_SECRET`, `DATABASE_URL`) are present immediately on server boot and throw clean error messages if they are missing.
- **Monorepo Separation**: Do not install backend dependencies in the client directory, and vice versa. Keep `node_modules` isolated.

## 15. Homework
- **Coding Exercise 1**: Add an endpoint `GET /api/time` to the Express backend that returns the current UTC time, local time, and server timezone offset in JSON format. Write a React component to display this information.
- **Coding Exercise 2**: Add an input text box to the client dashboard that lets the user type in their name and hit "Ping Server". Make it call `POST /api/health` sending the name, and return a personalized welcome string.
- **Conceptual Question 1**: What is the difference between npm's `dependencies` and `devDependencies`? Why did we place `nodemon` and `prisma` under `devDependencies`?
- **Conceptual Question 2**: Why do we use JSON payloads rather than plain text strings when designing APIs? How does it benefit multi-client scaling (e.g., mobile apps and web apps)?
- **Independent Challenge**: Write a custom middleware in Express that logs the incoming request method, URL, and execution time (in milliseconds) to the console for every API call.
