# Task Management Application (MERN Stack)

A full-stack Task Management application built using the **MERN stack** with **TypeScript**, **JWT authentication**, and **Socket.io** for real-time updates. The project follows a clean, scalable architecture with a clear separation of concerns between controllers, services, and data access layers.

---

##  Features

* User authentication (Register / Login) using JWT
* CRUD operations for tasks
* Pagination and filtering for task lists
* Real-time task updates using Socket.io
* Centralized error handling and logging
* Scalable and maintainable project structure

---

##  Tech Stack

### Frontend

* React + TypeScript
* Vite
* Axios
* Tailwind CSS
* Socket.io-client

### Backend

* Node.js
* Express.js
* TypeScript
* MongoDB + Mongoose
* JWT (JSON Web Token)
* Socket.io
* Winston (logging)

---

## Setup Instructions (Run Locally)

### Prerequisites

* Node.js (v18+ recommended)
* MongoDB (local or Atlas)
* npm or yarn

---

###  Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Run in production mode
npm start

# OR run in development mode with nodemon
npm run dev
```

Create a `.env` file in the backend root:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/task-manager
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

Backend will run on:

```
http://localhost:5000
```

---

### 🔹 Frontend Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Run frontend
npm run dev
```

Frontend will run on:

```
http://localhost:5173
```

---

## 📑 API Contract Documentation

Base URL:

```
/api/
```

---

##  Auth APIs

| Method | Endpoint           | Description                |
| ------ | ------------------ | -------------------------- |
| POST   | `/auth/register`   | Register a new user        |
| POST   | `/auth/login`      | Login user and return JWT  |
| POST   | `/auth/logout`     | Logout user                |
| GET    | `/auth/me`         | Get current logged-in user |

---

## User APIs

| Method | Endpoint          | Description                |
| ------ | ----------------  | -------------------------- |
| PUT    | `/users/profile`  | Update user profile        |
| GET    | `/users/all`      | Get all users (Admin only) |

---

## Notification APIs

| Method | Endpoint                  | Description                    |
| ------ | ------------------------- | ------------------------------ |
| GET    | `/notifications`          | Get all notifications          |
| PUT    | `/notifications/:id/read` | Mark notification as read      |
| PUT    | `/notifications/read-all` | Mark all notifications as read |
| DELETE | `/notifications/:id`      | Delete a notification          |

---

## Task APIs

| Method | Endpoint            | Description              |
| ------ | ------------------- | ------------------------ |
| POST   | `/tasks`            | Create a new task        |
| GET    | `/tasks`            | Get all tasks            |
| GET    | `/tasks/recent`     | Get recent tasks         |
| GET    | `/tasks/dashboard`  | Get dashboard statistics |
| GET    | `/tasks/:id`        | Get task by ID           |
| PUT    | `/tasks/:id`        | Update task              |
| PATCH  | `/tasks/:id/status` | Update task status       |
| DELETE | `/tasks/:id`        | Delete task              |

---

## Architecture Overview & Design Decisions

###1️⃣Architecture Pattern

The backend follows a **layered architecture**:

```
Routes → Controllers → Services → Models (DB)
```

* **Routes**: Define API endpoints
* **Controllers**: Handle HTTP requests/responses
* **Services**: Business logic (keeps controllers thin)
* **Models**: MongoDB schemas using Mongoose

This structure improves **readability, testability, and scalability**.

---

### 2️⃣ Database Choice (MongoDB)

* Schema flexibility (ideal for evolving task structures)
* Easy integration with Node.js via Mongoose
* Supports fast iteration during development

---

### 3️⃣ Authentication (JWT)

* JWT is generated during login/registration
* Token is sent via `Authorization: Bearer <token>` header
* Auth middleware validates token and attaches user info to request (`req.user`)

Why JWT?

* Stateless authentication
* Easy to scale
* No server-side session storage

---

### 4️⃣ Role-Based Authorization (RBAC)

The application implements **Role-Based Access Control (RBAC)** to restrict access to certain routes based on user roles.

#### Roles

* `user` – Default role assigned during registration
* `admin` – Has elevated permissions (e.g., managing all users)

#### How it works

1. During authentication, the user’s role is embedded inside the JWT payload.
2. After token verification, the decoded user object (including role) is attached to `req.user`.
3. An `authorize()` middleware checks whether the logged-in user has the required role before allowing access.

#### Example

```ts
router.get('/all', authenticate, authorize('admin'), getAllUsers);
```

If the user does not have the required role, the API responds with:

```json
{
  "message": "Access denied. Insufficient permissions"
}
```

#### Benefits

* Clear separation of permissions
* Easy to extend with more roles (e.g., `manager`, `moderator`)
* Improves security by enforcing least-privilege access

---

### 4️⃣ Service Layer

* All core logic (task creation, validation, DB calls) lives in services
* Controllers only orchestrate request/response
* Makes the app easier to test and maintain

---

## Real-Time Functionality (Socket.io)


Socket.io is integrated to enable real-time bidirectional communication between the backend and all connected clients. This ensures that task and notification updates are instantly reflected across all user interfaces without requiring manual refreshes.
### Backend Integration

* A Socket.io server is attached to the main Express HTTP server
* Connection middleware validates JWT tokens from socket handshake
* After authentication, users join rooms based on their user ID for targeted updates
* Service-layer events (task creation, updates, deletions) trigger socket emissions
* A single Socket.io instance is shared across the application.
* When important events occur (such as task creation, updates, deletion, or new notifications), the backend emits Socket.io events.

Example events emitted from the backend:

* `task:created`
* `task:updated`
* `task:deleted`
* `notification:new`

These events are usually triggered inside **service or controller layers** after successful database operations.

---

### Frontend Integration

* The frontend uses `socket.io-client` to establish a persistent WebSocket connection.
* On application load, the client connects to the Socket.io server.
* Components subscribe to relevant events and update local or global state (Redux/React state) when events are received.

This ensures that multiple users see updates in real time, such as newly created tasks or notification status changes.

---

### Event Flow Example

* User A creates a new task → backend saves to database
* Backend emits task:created event to all connected clients
* User B (viewing task list) receives the event and sees new task appear immediately
* Backend also emits notification:new to task assignees if applicable


### Real-Time Communication with Socket.io


* Automatic fallback to HTTP polling if WebSockets are unavailable
* Built-in event-based communication model
* Easy integration with existing Express applications

---

##  Trade-offs & Assumptions

* **JWT stored on client side** (assumed secure handling on frontend)
* **Basic RBAC implemented with admin/user roles
* **Basic pagination** instead of cursor-based pagination
* **Single MongoDB collection for tasks** (simple and sufficient for current scope)
* **WebSockets only for task events**, not for authentication

---

##  Future Improvements

* Role-based access (Admin/User)
* Task status history & audit logs
* Redis for caching
* Unit & integration tests (Jest)
* Dockerization

---

