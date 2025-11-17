# Notarium

A modern note-sharing platform for students built with React, TypeScript, Cloudflare Workers, and D1 Database.

## Features

- **Notes Management** - Create, share, and organize notes by subject with search functionality
- **AI Study Assistant** - Chat with AI, generate summaries, quizzes, and study plans
- **Gamification** - Earn points and badges, compete on leaderboards
- **OCR Technology** - Upload images and extract text automatically
- **Admin Moderation** - User management and content moderation tools
- **Mobile Responsive** - Full mobile support with touch-optimized interface

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS
**Backend:** Cloudflare Workers, Hono, D1 Database
**AI:** DeepSeek for AI chat, summarization, and study assistance
**Auth:** JWT with email/password authentication

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

Licensed