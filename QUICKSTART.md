# Notarium+ Quick Start Guide

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- Cloudflare account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   cd Notarium+
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:5173
   - Backend: http://localhost:56533

## Project Structure

### Frontend (`src/`)
```
├── pages/          # Page components
├── components/     # Reusable components & modals
├── lib/           # API client
├── theme.ts       # Dark theme configuration
├── App.tsx        # Main app with routing
└── index.css      # Global styles
```

### Backend (`backend/`)
```
└── src/
    └── index.ts   # All API endpoints
```

## Available Commands

```bash
# Development
npm run dev              # Start dev servers
npm run dev:frontend    # Frontend only
npm run dev:backend     # Backend only

# Building
npm run build           # Build both frontend and backend
npm run build:frontend  # Frontend only
npm run build:backend   # Backend only

# Deployment
wrangler deploy         # Deploy to Cloudflare Workers
```

## Key Features

### For Students
- **Browse Subjects**: View all available subjects
- **View Notes**: See notes uploaded by other students
- **AI Study Tools**:
  - Summarize notes automatically
  - Generate practice quizzes
  - Create study plans
  - Get concept explanations
- **Study Chat**: Chat with an AI tutor about any topic
- **Leaderboard**: Compete with other students
- **Profile**: Customize your profile and class

### For Admins
- **User Management**: View, suspend, or delete users
- **Note Moderation**: View all notes and monitor content
- **Analytics**: See platform statistics

## First Time Setup

1. **Create an admin account**
   - Sign up with your credentials
   - Set ADMIN_EMAIL_DOMAIN in backend if you want to restrict admins

2. **Add subjects** (Done in database, but can be extended)
   - Currently 14 subjects are pre-seeded:
     - Mathematics, Physics, Chemistry, Biology
     - English, History, Geography, Civics
     - Economics, Psychology, Philosophy, Art
     - Music, Sports

3. **Test the platform**
   - Log in as a student
   - Try uploading a note
   - Generate a quiz
   - Check the leaderboard

## Common Tasks

### Adding a New Subject
Edit `backend/src/index.ts` and update the subjects table seed data.

### Customizing Colors
Edit `src/theme.ts` to change the dark theme colors.

### Adding a New Page
1. Create component in `src/pages/`
2. Import in `src/App.tsx`
3. Add to navigation in HomePage

### Adding a New API Endpoint
1. Add route in `backend/src/index.ts`
2. Add method to `api` object in `src/lib/api.ts`
3. Use in components

## Deployment

### Deploy to Cloudflare

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy**
   ```bash
   wrangler deploy
   ```

3. **Set environment variables** in Cloudflare dashboard:
   - ADMIN_EMAIL_DOMAIN
   - ADMIN_PASSWORD
   - GEMINI_API_KEY (for real AI)

### Deploy Frontend to Cloudflare Pages

1. **Connect your GitHub repo to Cloudflare Pages**
2. **Set build command**: `npm run build:frontend`
3. **Set publish directory**: `dist`

## Troubleshooting

### Port already in use
```bash
# Kill process on port 56533 (backend)
lsof -ti:56533 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Database errors
- Check `backend/src/index.ts` database initialization
- Ensure D1 database is created in Cloudflare dashboard

### API not responding
- Check backend is running on correct port
- Verify CORS headers are configured
- Check browser console for errors

### Authentication issues
- Clear browser localStorage
- Check token is being stored correctly
- Verify JWT secret in backend

## Performance Tips

1. **Lazy load page components** - Currently loaded on demand
2. **Optimize API calls** - Debounce search queries
3. **Cache frequently accessed data** - Use React Query
4. **Minify CSS/JS** - Handled by Vite

## Security Best Practices

1. **Environment Variables**: Never commit .env file
2. **API Keys**: Use Cloudflare secrets for production
3. **CORS**: Configure specific origins
4. **Input Validation**: Always validate user input
5. **Rate Limiting**: Implement per IP/user

## Support

- Check DEPLOYMENT.md for production setup
- Review API endpoints in DEPLOYMENT.md
- Check browser console for error messages

## Next Steps

1. Review DEPLOYMENT.md for production guidance
2. Integrate real AI (Gemini API)
3. Add file upload support
4. Implement email notifications
5. Add WebSocket for real-time chat
