# Backend Developer Instructions — MaxTeam

> **Read this entire document before writing a single line of code.**  
> Every new feature, model, route, or utility must follow the exact patterns described here. Do not invent your own structure.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Folder Structure](#2-folder-structure)
3. [Environment Variables](#3-environment-variables)
4. [Entry Points — `index.js` & `app.js`](#4-entry-points--indexjs--appjs)
5. [Database Connection — `db/index.js`](#5-database-connection--dbindexjs)
6. [MVC Pattern Overview](#6-mvc-pattern-overview)
7. [Models](#7-models)
8. [Controllers](#8-controllers)
9. [Routes](#9-routes)
10. [Middlewares](#10-middlewares)
11. [Utils](#11-utils)
12. [Naming Conventions](#12-naming-conventions)
13. [Code Style & Formatting](#13-code-style--formatting)
14. [Adding a New Feature — Step-by-Step](#14-adding-a-new-feature--step-by-step)

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM — `"type": "module"`) |
| Framework | Express v5 |
| Database | MongoDB via Mongoose |
| Auth | JWT (access + refresh tokens) stored in **httpOnly cookies** |
| Email | Resend + Mailgen |
| Real-time | Socket.IO |
| Dev tooling | nodemon, Prettier |

---

## 2. Folder Structure

```
project-root/
├── src/
│   ├── index.js            ← server bootstrap + Socket.IO setup
│   ├── app.js              ← Express app, middleware registration, route mounting
│   ├── db/
│   │   └── index.js        ← MongoDB connection helper
│   ├── models/
│   │   └── *.models.js     ← Mongoose schemas & models
│   ├── controllers/
│   │   └── *.controllers.js← Business logic, one file per resource
│   ├── routes/
│   │   └── *.routes.js     ← Express Router definitions, one file per resource
│   ├── middlewares/
│   │   └── *.middleware.js ← Express middleware (auth, validation, etc.)
│   └── utils/
│       ├── api-error.js    ← ApiError class
│       ├── api-response.js ← ApiResponse class
│       ├── async-handler.js← asyncHandler wrapper
│       ├── constants.js    ← Enums & allowed-value arrays
│       ├── mail.js         ← Email sending helpers
│       └── link-utils.js   ← Any other shared helpers
├── .env.example            ← Template for required environment variables
├── .prettierrc             ← Prettier config (DO NOT change)
├── package.json
└── vercel.json
```

> **Rule:** Every folder under `src/` has a strict purpose. Never create files outside these folders.

---

## 3. Environment Variables

Copy `.env.example` to `.env` and fill in every variable before starting the server.

```
PORT=8000
MONGO_URI=<your MongoDB connection string>
ACCESS_TOKEN_SECRET=<random strong secret>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=<different random strong secret>
REFRESH_TOKEN_EXPIRY=7d
RESEND_API_KEY=<Resend API key>
BASE_URL=http://localhost:5173
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

- **Never commit `.env`** — it is already in `.gitignore`.
- When adding a new variable, also add it to `.env.example` with a placeholder value.

---

## 4. Entry Points — `index.js` & `app.js`

### `src/index.js` — Server bootstrap

This file is the **only** place where:
- `dotenv` is loaded (only in non-production).
- The HTTP server is created and wrapped with Socket.IO.
- `connectDB()` is called, and the server starts listening after DB connects.
- Socket.IO event listeners (`connection`, `join_project`, `join_user`, `disconnect`) are registered.
- The Socket.IO instance is attached to the app via `app.set("io", io)` so controllers can emit events.

```js
// Pattern — do not deviate
import app from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: "./.env" });
}

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { ... } });

app.set("io", io);

io.on("connection", (socket) => { ... });

connectDB().then(() => {
  httpServer.listen(PORT, () => { ... });
}).catch((err) => { process.exit(1); });
```

### `src/app.js` — Express app

This file is the **only** place where:
- The Express app is created and exported.
- Global middleware is registered (`cors`, `express.json`, `express.urlencoded`, `cookieParser`).
- All routers are imported and mounted under `/api/v1/<resource>`.

```js
// Mount pattern
app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/user", userAuth);
app.use("/api/v1/<new-resource>", newResourceRouter);
```

> When you add a new resource, import its router here and mount it — nothing else changes in this file.

---

## 5. Database Connection — `db/index.js`

```js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) return; // already connected
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("Mongodb connection failed", error);
    throw error;
  }
};

export default connectDB;
```

- **Do not** call `connectDB` anywhere except `src/index.js`.
- The guard `readyState >= 1` prevents duplicate connections in serverless cold starts.

---

## 6. MVC Pattern Overview

```
Request → Route → Middleware(s) → Controller → Model → Controller → Response
```

| Layer | Responsibility |
|---|---|
| **Route** | Define URL + HTTP method, chain middleware, call controller |
| **Middleware** | Authenticate, authorise, validate input |
| **Controller** | Business logic: validate body, call model, build response |
| **Model** | Schema, DB queries, instance methods |
| **Utils** | Reusable pure helpers (no Express, no DB calls) |

---

## 7. Models

**File naming:** `src/models/<resource>.models.js` — always plural, lowercase, hyphenated.

### Mongoose Schema Rules

- Always pass `{ timestamps: true }` as the second schema argument — this gives you `createdAt` and `updatedAt` for free.
- Use `required: true` for any field the document cannot exist without.
- Use `trim: true` on all String fields unless there is a specific reason not to.
- Use `lowercase: true` on `email` and `username` fields.
- Use `enum` + a constants array (from `utils/constants.js`) for fields with a fixed set of allowed values.
- Use `Schema.Types.ObjectId` + `ref` for all relational references.

### Instance Methods

Add reusable logic as schema methods, not in controllers:

```js
// Password hashing — always in a pre("save") hook
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Password comparison
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// JWT generation
userSchema.methods.generateAccessToken = function () {
  return jwt.sign({ _id: this._id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
};
```

### Export Pattern

```js
// Named export — always this way
export const User = mongoose.model("User", userSchema);
```

---

## 8. Controllers

**File naming:** `src/controllers/<resource>.controllers.js`

### Rules

1. **Every controller function is wrapped with `asyncHandler`** — never use `try/catch` directly in a controller.
2. **Use `ApiError` for all error responses** and **`ApiResponse` for all success responses**.
3. **Always set an HTTP status code** on every response path.
4. **Input validation first** — check required fields at the top of the function, return early with `400` if anything is missing.
5. **DB operation** — then perform the database work.
6. **Response** — return the response at the end.

### Controller Template

```js
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { MyModel } from "../models/mymodel.models.js";

const createSomething = asyncHandler(async (req, res) => {
  // 1. Extract & validate input
  const { field1, field2 } = req.body;
  if (!field1 || !field2) {
    return res.status(400).json(new ApiError(400, "All fields are required"));
  }

  // 2. Business logic / DB operation
  const doc = await MyModel.create({ field1, field2 });
  if (!doc) {
    return res.status(400).json(new ApiError(400, "Failed to create resource"));
  }

  // 3. Return success response
  return res
    .status(201)
    .json(new ApiResponse(201, { doc }, "Resource created successfully"));
});

export { createSomething };
```

### Emitting Socket.IO Events from a Controller

```js
const io = req.app.get("io");
io.to(projectId).emit("event_name", payload);
```

---

## 9. Routes

**File naming:** `src/routes/<resource>.routes.js`

### Rules

1. Import `Router` from `express`.
2. Import controller functions and any required middleware.
3. Use `router.route("/<path>")` chaining (`.get`, `.post`, `.put`, `.patch`, `.delete`) when the same path supports multiple methods.
4. Use standalone `router.get(...)` / `router.post(...)` etc. for single-method paths — both styles are fine, keep consistency within the same file.
5. Always chain middleware **before** the controller in the argument list:  
   `router.post("/path", isLoggedIn, validateProjectPermission([...]), controllerFn)`
6. Export as `default`.

### Route Template

```js
import { Router } from "express";
import { isLoggedIn, validateProjectPermission } from "../middlewares/auth.middleware.js";
import { UserRolesEnum, AvailableUserRoles } from "../utils/constants.js";
import { createSomething, getSomething } from "../controllers/something.controllers.js";

const router = Router();

router.route("/")
  .get(isLoggedIn, getSomething)
  .post(isLoggedIn, validateProjectPermission([UserRolesEnum.ADMIN]), createSomething);

export default router;
```

---

## 10. Middlewares

**File naming:** `src/middlewares/<name>.middleware.js`

### Existing Middlewares

#### `isLoggedIn`

Verifies the `accessToken` cookie and attaches the full user object (minus sensitive fields) to `req.user`. Use this on every protected route.

```js
router.get("/profile", isLoggedIn, getProfile);
```

#### `validateProjectPermission(roles[])`

A higher-order middleware — call it with an array of allowed roles.  
Checks that `req.user` is a member of the project identified by `req.params.projectId` and that their role is in the provided list.

```js
// Allow any project member
validateProjectPermission(AvailableUserRoles)

// Allow only admins and project admins
validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN])
```

### Writing a New Middleware

```js
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

const myMiddleware = asyncHandler(async (req, res, next) => {
  // validation logic...
  if (somethingWrong) {
    return res.status(403).json(new ApiError(403, "Forbidden"));
  }
  next();
});

export { myMiddleware };
```

---

## 11. Utils

These files live in `src/utils/` and are **pure helpers** — no Express request/response logic, no direct DB calls.

### `api-error.js` — `ApiError`

Extends the native `Error` class. Use it everywhere you need to return an error response.

```js
new ApiError(statusCode, message, errors?, stack?)

// Examples
new ApiError(400, "All fields are required")
new ApiError(404, "User not found")
new ApiError(403, "You do not have permission to perform this action")
```

Properties on the instance: `statusCode`, `message`, `success: false`, `errors[]`.  
Has a `toJSON()` method so `res.json(new ApiError(...))` works correctly.

### `api-response.js` — `ApiResponse`

Use it for every successful response.

```js
new ApiResponse(statusCode, data, message?)

// Examples
new ApiResponse(200, { user }, "User fetched successfully")
new ApiResponse(201, { doc }, "Created successfully")
```

`success` is automatically `true` when `statusCode < 400`.

### `async-handler.js` — `asyncHandler`

Wraps any async controller/middleware function and forwards thrown errors to Express's `next(err)`.  
**Every controller and async middleware must be wrapped in this.**

```js
import { asyncHandler } from "../utils/async-handler.js";

const myController = asyncHandler(async (req, res) => {
  // no try/catch needed
});
```

### `constants.js` — Enums

All fixed-value sets live here. When a model field uses `enum`, import from here.

```js
export const UserRolesEnum = {
  ADMIN: "admin",
  PROJECT_ADMIN: "project_admin",
  MEMBER: "member",
};
export const AvailableUserRoles = Object.values(UserRolesEnum);

export const TaskStatusEnum = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
};
export const AvailableTaskStatuses = Object.values(TaskStatusEnum);
```

**When you need a new enum** — add it here, never hardcode strings in models or controllers.

### `mail.js` — Email Helpers

Email is sent via **Resend** and styled via **Mailgen**.

```js
// Send any email
sendEmail({ email, subject, mailgenContent })

// Pre-built content generators
emailVerificationMailgenContent(username, verificationUrl, expiry)
forgotPasswordRequestMailgenContent(username, resetUrl, expiry)
```

When adding a new email type, add a new `*MailgenContent` function in this file following the same pattern.

---

## 12. Naming Conventions

| What | Convention | Example |
|---|---|---|
| Files | lowercase, hyphen-separated, with layer suffix | `task.controllers.js`, `auth.middleware.js` |
| Variables / functions | `camelCase` | `registerUser`, `accessToken` |
| Classes | `PascalCase` | `ApiError`, `ApiResponse` |
| Mongoose model names | `PascalCase` | `mongoose.model("User", ...)` |
| Model export | Named, `PascalCase` | `export const ProjectTask = ...` |
| Enum objects | `PascalCase` + `Enum` suffix | `UserRolesEnum`, `TaskStatusEnum` |
| Allowed-values arrays | `Available` prefix | `AvailableUserRoles` |
| Route path segments | lowercase, hyphen-separated | `/api/v1/project-note` |
| Env variable names | `UPPER_SNAKE_CASE` | `ACCESS_TOKEN_SECRET` |

---

## 13. Code Style & Formatting

Prettier is configured in `.prettierrc`. Run it before committing:

```bash
npx prettier --write "src/**/*.js"
```

Key settings (do not change):

| Setting | Value |
|---|---|
| `tabWidth` | `2` |
| `useTabs` | `false` |
| `semi` | `true` |
| `singleQuote` | `false` (use double quotes) |
| `trailingComma` | `"all"` |
| `arrowParens` | `"always"` |

---

## 14. Adding a New Feature — Step-by-Step

Use this checklist every time you add a new resource (e.g., "Comments").

### Step 1 — Define constants (if needed)

In `src/utils/constants.js`, add any enums the new model requires:

```js
export const CommentStatusEnum = { ... };
export const AvailableCommentStatuses = Object.values(CommentStatusEnum);
```

### Step 2 — Create the Model

`src/models/comment.models.js`

```js
import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
  {
    content: { type: String, required: true, trim: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    task:   { type: Schema.Types.ObjectId, ref: "Task",  required: true },
  },
  { timestamps: true },
);

export const Comment = mongoose.model("Comment", commentSchema);
```

### Step 3 — Create the Controller

`src/controllers/comment.controllers.js`

```js
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { Comment } from "../models/comment.models.js";

const createComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json(new ApiError(400, "Content is required"));
  }

  const comment = await Comment.create({
    content,
    author: req.user._id,
    task: req.params.taskId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { comment }, "Comment created"));
});

export { createComment };
```

### Step 4 — Create the Router

`src/routes/comment.routes.js`

```js
import { Router } from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { createComment } from "../controllers/comment.controllers.js";

const router = Router();

router.post("/:taskId", isLoggedIn, createComment);

export default router;
```

### Step 5 — Mount the Router in `app.js`

```js
import comment from "./routes/comment.routes.js";
// ...
app.use("/api/v1/comment", comment);
```

### Step 6 — Update `.env.example` (if new variables were introduced)

Add placeholder entries for any new environment variables.

---

> **Golden rules:**
> - Every async function → `asyncHandler`.
> - Every error → `new ApiError(statusCode, message)`.
> - Every success → `new ApiResponse(statusCode, data, message)`.
> - Every enum → `constants.js`.
> - Every email → `mail.js`.
> - Never put business logic in routes.
> - Never put DB queries in utils.
