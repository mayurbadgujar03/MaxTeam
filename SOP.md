# Standard Operating Procedure (SOP) — MaxTeam

## 1. Purpose
This SOP defines how to consistently set up, run, and maintain the MaxTeam backend and frontend applications in local development.

## 2. Scope
Applies to all contributors working on this repository:
- Backend: `src/` (Node.js + Express)
- Frontend: `app/` (React + Vite)

## 3. Prerequisites
- Node.js 18 or above
- npm
- MongoDB connection string (Atlas or local instance)

## 4. Initial Setup
1. Clone the repository and move into it.
2. Install backend dependencies from repository root:
   - `npm install`
3. Install frontend dependencies:
   - `cd app`
   - `npm install`

## 5. Environment Configuration
Create backend `.env` in repository root:

```env
PORT=8000
MONGO_URI=<mongodb_connection_string>
ACCESS_TOKEN_SECRET=<strong_random_secret>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=<strong_random_secret>
REFRESH_TOKEN_EXPIRY=7d
BASE_URL=http://localhost:5173
NODE_ENV=development
RESEND_API_KEY=<resend_api_key>
```

Create frontend `app/.env`:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## 6. Start Services
1. Start backend from repository root:
   - `npm run dev`
2. Start frontend from `app/`:
   - `npm run dev`

Default URLs:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api/v1`

## 7. Validation and Quality Checks
When available, run checks before opening a PR:
- Frontend lint: `cd app && npm run lint`
- Frontend build: `cd app && npm run build`

If commands fail due environment/tooling issues, resolve dependency installation first and rerun the checks.

## 8. Operational Best Practices
- Never commit secrets or actual API keys.
- Keep `.env` values environment-specific and out of version control.
- Make small, focused commits and test impacted areas before pushing.
- Update `README.md`/SOP when setup or run commands change.

## 9. Incident/Failure Handling
- If backend fails at startup, verify `.env`, `MONGO_URI`, and Node version.
- If frontend fails to run/build, reinstall dependencies in `app/` and retry.
- If API calls fail from frontend, confirm `VITE_API_URL` and backend status.

## 10. Ownership and Updates
- Any contributor changing setup, scripts, or operational flow must update this SOP in the same PR.
