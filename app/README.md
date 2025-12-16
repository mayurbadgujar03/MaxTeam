# Flowbase - JavaScript Version

This is the JavaScript/JSX version of the Flowbase application, converted from TypeScript.

## Project Structure

This is a complete React + Vite application using:
- **React 18** - UI library
- **React Router** - Routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Styling
- **Shadcn/UI** - Component library
- **Lucide React** - Icons

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# or
yarn install
```

### Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:8080
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
team-js/
├── public/           # Static assets
├── src/
│   ├── api/         # API client functions
│   ├── components/  # React components
│   │   ├── auth/   # Authentication components
│   │   ├── layout/ # Layout components
│   │   ├── members/# Member components
│   │   ├── notes/  # Note components
│   │   ├── projects/# Project components
│   │   ├── tasks/  # Task components
│   │   └── ui/     # Reusable UI components
│   ├── contexts/   # React contexts
│   ├── hooks/      # Custom React hooks
│   ├── lib/        # Utility libraries
│   ├── pages/      # Page components
│   │   └── auth/   # Authentication pages
│   ├── types/      # JSDoc type definitions
│   ├── App.jsx     # Main App component
│   ├── main.jsx    # Entry point
│   └── index.css   # Global styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Features

- ✅ User Authentication (Login, Register, Password Reset)
- ✅ Project Management
- ✅ Task Management with Kanban Board
- ✅ Team Members Management
- ✅ Notes/Documentation
- ✅ Responsive Design
- ✅ Dark Mode Support

## Backend Integration

This frontend is ready to be plugged into your backend. Configure the API URL in your environment:

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3000/api
```

Or update the default in `src/lib/api-client.js`.

## API Endpoints Expected

The frontend expects these API endpoints:

### Authentication
- POST `/auth/login`
- POST `/auth/register`
- POST `/auth/logout`
- GET `/auth/me`
- POST `/auth/verify-email`
- POST `/auth/forgot-password`
- POST `/auth/reset-password`
- POST `/auth/change-password`
- POST `/auth/refresh-access-token`

### Projects
- GET `/projects`
- GET `/projects/:id`
- POST `/projects`
- PUT `/projects/:id`
- DELETE `/projects/:id`

### Tasks
- GET `/projects/:projectId/tasks`
- GET `/projects/:projectId/tasks/:taskId`
- POST `/projects/:projectId/tasks`
- PUT `/projects/:projectId/tasks/:taskId`
- DELETE `/projects/:projectId/tasks/:taskId`
- PATCH `/projects/:projectId/tasks/:taskId/assign`
- POST `/projects/:projectId/tasks/:taskId/attachments`

### Members
- GET `/projects/:projectId/members`
- POST `/projects/:projectId/members`
- PATCH `/projects/:projectId/members/:memberId`
- DELETE `/projects/:projectId/members/:memberId`

### Notes
- GET `/projects/:projectId/notes`
- GET `/projects/:projectId/notes/:noteId`
- POST `/projects/:projectId/notes`
- PUT `/projects/:projectId/notes/:noteId`
- DELETE `/projects/:projectId/notes/:noteId`

### Subtasks
- GET `/projects/:projectId/tasks/:taskId/subtasks`
- POST `/projects/:projectId/tasks/:taskId/subtasks`
- PUT `/projects/:projectId/tasks/:taskId/subtasks/:subtaskId`
- DELETE `/projects/:projectId/tasks/:taskId/subtasks/:subtaskId`

## Type Definitions

Type definitions are provided as JSDoc comments in `src/types/index.js`. These can be used with VS Code IntelliSense for better development experience.

## Authentication

The app uses JWT tokens with:
- Access tokens (stored in memory)
- Refresh tokens (HTTP-only cookies)
- Automatic token refresh on 401 responses


