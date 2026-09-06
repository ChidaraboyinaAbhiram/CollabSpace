# Sprint 1 Documentation: Authentication & Authorization

## 1. Goal
The goal of Sprint 1 is to build a secure, production-level authentication and authorization system using bcrypt password hashing, JSON Web Tokens (JWT), input validation middleware, global React AuthContext, and protected client routes.

## 2. Problem Statement
Without an authentication layer:
- Any user could create, alter, or delete any document.
- Users could not be identified during real-time document editing sessions.
- Private workspaces could be accessed by unauthorized external parties.

## 3. Why We Need This Feature
Authentication establishes identity. In a real-time collaborative document platform like Google Docs or Notion, identity is essential for:
- Document ownership and permission access control (View vs. Edit).
- Displaying real-time cursor presence names ("Alex Mercer is editing line 14").
- Protecting API endpoints from unauthenticated requests.

## 4. Workflow
1. **Registration/Login**: User enters credentials on `/register` or `/login`.
2. **Validation & Hashing**: Backend validates inputs (`validateRegister`), hashes the password using `bcryptjs` with salt round 10, and queries PostgreSQL via Prisma ORM.
3. **JWT Generation**: On successful authentication, server signs a JWT containing the user's ID (`userId`) and returns it alongside sanitized user profile data.
4. **Client Session**: React `AuthContext` receives the token, stores it in `localStorage`, and updates global user state.
5. **Protected Requests**: For protected APIs like `/api/auth/me`, client sends `Authorization: Bearer <token>`. The Express `authenticateToken` middleware verifies the token signature and attaches `req.user`.

```
[ Client Form ] --(POST /api/auth/register or /login)--> [ Express Server ]
                                                                 |
                                                     (Validate & Hash Password)
                                                                 v
                                                     [ Prisma ORM / Postgres ]
                                                                 |
                                                     (Issue Signed JWT Token)
                                                                 v
[ Saved in localStorage & AuthContext ] <------- (Returns Token + User Payload)
```

## 5. Architecture
- **Password Security**: Passwords are never stored in plain text. `bcryptjs` creates salted hashes (`$2a$10$...`) resistant to rainbow table attacks.
- **Stateless Tokens**: JWTs allow the backend to verify user identity without querying session database tables on every single HTTP request.
- **Protected Component Wrappers**: `<ProtectedRoute>` intercepts unauthenticated visitors attempting to open private routes and redirects them to `/login`.

## 6. Folder Changes
```
server/
├── prisma/
│   └── schema.prisma                # Added User model
├── src/
│   ├── config/
│   │   └── db.js                    # Prisma client singleton
│   ├── controllers/
│   │   └── auth.controller.js       # Register, Login, Me handlers + fallback store
│   ├── middleware/
│   │   ├── auth.middleware.js       # Bearer token verification middleware
│   │   └── validate.middleware.js   # Input validation middleware
│   ├── routes/
│   │   └── auth.routes.js           # Auth routes
│   └── server.js                    # Mounted /api/auth routes

client/
├── src/
│   ├── context/
│   │   └── AuthContext.jsx          # Global Auth Provider & Hooks
│   ├── components/
│   │   └── ProtectedRoute.jsx       # Auth guard component
│   ├── pages/
│   │   ├── Login.jsx                # Login page
│   │   ├── Register.jsx             # Registration page
│   │   └── Dashboard.jsx            # Authenticated workspace view
│   └── App.jsx                      # Router & AuthProvider configuration
```

## 7. Database Changes
Updated `server/prisma/schema.prisma` with the `User` table model:
```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 8. API Changes
- `POST /api/auth/register`: Public registration endpoint.
- `POST /api/auth/login`: Public login endpoint.
- `GET /api/auth/me`: Protected endpoint returning user profile.

## 9. What I Learned
- **Bcrypt Hashing**: Why plain text passwords should never touch database storage.
- **JWT Anatomy**: Header, Payload (`userId`, `exp`), and Signature verified with `JWT_SECRET`.
- **Custom React Hooks & Context**: Creating `useAuth()` to provide auth state application-wide.
- **Route Guards**: Protecting client components using high-order wrapper components.

## 10. Interview Questions
1. **Q**: What is the difference between Authentication and Authorization?
   - **A**: Authentication verifies *who you are* (logging in with email/password). Authorization determines *what you can do* (checking if a logged-in user has edit rights on a specific document).
2. **Q**: What is a JSON Web Token (JWT), and how does signature verification work?
   - **A**: A JWT is an encoded string with three parts: Header, Payload, and Signature. The signature is computed by hashing `Header + Payload` with a secret key on the server. If a client tampers with the payload, the signature check fails.
3. **Q**: What is password salting, and why is it important in `bcrypt`?
   - **A**: A salt is a random string added to the password before hashing. It prevents attackers from using pre-computed rainbow tables to reverse hashed passwords.
4. **Q**: Where should JWT tokens be stored on the frontend, and what are the security trade-offs?
   - **A**: Tokens can be stored in `localStorage` (accessible via JS, vulnerable to XSS) or in `httpOnly` Cookies (inaccessible to JS, vulnerable to CSRF unless protected with SameSite flags and CSRF tokens).
5. **Q**: Why do we use UUIDs instead of auto-incrementing integers (`1, 2, 3`) for user and document IDs?
   - **A**: Sequential IDs allow attackers to guess valid resource endpoints (`/documents/1`, `/documents/2`). UUIDs are globally unique, 128-bit random strings impossible to enumerate.

## 11. Common Mistakes
- **Exposing Secrets**: Hardcoding `JWT_SECRET` directly in source code instead of referencing `process.env.JWT_SECRET`.
- **Password Leakage**: Accidentally returning the `password` field in JSON API responses. Always sanitize payloads using Prisma `select` or manual field deletion.
- **Storing Unhashed Passwords**: Saving raw user passwords in the database.

## 12. Best Practices
- **Sanitize Input**: Normalize emails to lowercase (`email.toLowerCase().trim()`) before saving or searching.
- **Defensive Expiration**: Set reasonable expiration times on access tokens (e.g. `7d` or `15m` with refresh tokens).
- **Graceful Error Handling**: Return generic error messages for failed logins ("Invalid email or password") to prevent username enumeration.

## 13. Homework
- **Coding Exercise 1**: Add a "Show/Hide Password" toggle button in `Login.jsx` and `Register.jsx` using React state.
- **Coding Exercise 2**: Add password strength indicator validation in `Register.jsx` (checking for uppercase letter, number, and special character).
- **Conceptual Question 1**: What is the difference between symmetric encryption (like JWT signing with secret key) and asymmetric encryption (RS256 with public/private key pairs)?
- **Conceptual Question 2**: How would you implement a "Forgot Password" feature with password reset tokens?
- **Independent Challenge**: Build a `ChangePassword.jsx` form and endpoint `PUT /api/auth/change-password` requiring current password confirmation before updating to a new bcrypt hash.
