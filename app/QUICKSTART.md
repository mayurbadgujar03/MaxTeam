# Quick Start Guide

## Installation

1. Navigate to the project directory:
```bash
cd team-js
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory (optional):
```env
VITE_API_URL=http://localhost:3000/api
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to:
```
http://localhost:8080
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Backend Integration

This frontend expects a REST API backend. Make sure your backend:

1. Implements all the API endpoints listed in README.md
2. Uses JWT authentication with access tokens and refresh tokens
3. Returns responses in the format: `{ statusCode, data, message }`
4. Supports CORS for the frontend origin
5. Sets HTTP-only cookies for refresh tokens

## Project Structure

All source code is in the `src/` directory:
- `/api` - API client functions
- `/components` - React components (UI, layout, features)
- `/contexts` - React Context providers
- `/hooks` - Custom React hooks
- `/lib` - Utility functions
- `/pages` - Page components for routing
- `/types` - JSDoc type definitions

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000/api` |

## Troubleshooting

**Issue:** Port 8080 is already in use
**Solution:** Change the port in `vite.config.js`:
```js
server: {
  port: 3000, // your preferred port
}
```

**Issue:** API calls failing
**Solution:** Check that:
1. Your backend is running
2. CORS is configured correctly
3. The API URL in `.env` or `api-client.js` is correct

**Issue:** Module not found errors
**Solution:** Run `npm install` again to ensure all dependencies are installed

## Production Build

1. Build the project:
```bash
npm run build
```

2. The production files will be in the `dist/` directory

3. Deploy the `dist/` folder to your hosting service (Vercel, Netlify, etc.)

## TypeScript Version

If you need the TypeScript version, it's available in the `team/` directory.
