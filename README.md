# Notarium

A modern note-sharing platform for students built with React, TypeScript, Cloudflare Workers, and D1 Database.

## Features

- **Authentication** - Google OAuth 2.0 with JWT sessions
- **Notes Management** - Create, edit, and share notes with subject categorization
- **AI Study Assistant** - Chat sessions for study help
- **User Dashboard** - Track stats, points, and recent activity

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS
**Backend:** Cloudflare Workers, Hono, D1 Database
**Auth:** Google OAuth 2.0, JWT

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:5173` for frontend and `http://localhost:8787` for backend.

## Deployment

```bash
# Deploy backend to Cloudflare Workers
npm run deploy:backend

# Deploy frontend to Vercel
vercel
```

## License

MIT