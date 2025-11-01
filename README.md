# 🎓 Notarium - Student Note Sharing Platform

**Version 2.0 - Youware-Free, OAuth-Fixed, Production-Ready**

A modern, full-stack note-sharing platform for students built with React, TypeScript, Cloudflare Workers, and D1 Database.

---

## ✨ Features

### 🔐 Authentication
- Google OAuth 2.0 integration
- JWT-based session management
- Secure token storage
- Protected routes

### 📝 Notes Management
- Create, edit, delete notes
- Public/private note visibility
- Rich text content
- Subject categorization
- Tags and search
- Version history
- Views and ratings

### 🎯 Subjects & Organization
- Pre-configured subjects (Math, Science, History, etc.)
- Subject-based filtering
- Note counts per subject
- Custom icons

### 💬 AI Study Assistant
- Chat sessions per subject/topic
- Message history
- Study companion features

### 📊 User Dashboard
- Personal statistics
- Notes count
- Points system
- Class information
- Recent notes feed

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router v7** - Routing
- **Tailwind CSS** - Styling
- **Font Awesome** - Icons

### Backend
- **Cloudflare Workers** - Serverless runtime
- **Hono** - Lightweight web framework
- **D1 Database** - SQLite database
- **JWT** - Authentication
- **Google OAuth 2.0** - User authentication

---

## 📁 Project Structure

```
notarium/
├── src/
│   ├── index.ts              # Backend API (Cloudflare Workers)
│   ├── App.tsx               # Main React app
│   ├── main.tsx              # React entry point
│   ├── index.css             # Global styles
│   └── lib/
│       └── api.ts            # API client
├── database_export_*/        # Database schema & seed data
├── wrangler.toml             # Cloudflare configuration
├── package.json              # Dependencies
├── vite.config.ts            # Vite configuration
├── tailwind.config.js        # Tailwind CSS config
├── postcss.config.js         # PostCSS config
├── tsconfig.json             # TypeScript config
└── .env                      # Environment variables (create this)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- Cloudflare account (free)
- Google Cloud project (for OAuth)

### 1. Clone & Install

```bash
git clone <your-repo>
cd notarium
npm install
```

### 2. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add redirect URIs:
   - `http://localhost:5173/auth/callback`
   - `https://your-domain.com/auth/callback`
5. Copy Client ID and Client Secret

### 3. Configure Environment

Create `.dev.vars` for backend:

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
JWT_SECRET=your_random_secret_at_least_32_characters
FRONTEND_URL=http://localhost:5173
```

Create `.env` for frontend:

```env
VITE_API_URL=http://localhost:8787
```

### 4. Set Up Database

```bash
# Create D1 database
npx wrangler d1 create notarium-db

# Update database_id in wrangler.toml with output

# Initialize schema
npm run db:local
```

### 5. Run Development Server

```bash
npm run dev
```

This starts:
- Backend at http://localhost:8787
- Frontend at http://localhost:5173

---

## 🚢 Deployment

### Deploy Backend (Cloudflare Workers)

```bash
# Set secrets
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put JWT_SECRET

# Initialize production database
npm run db:prod

# Deploy
npm run deploy:backend
```

Backend URL: `https://notarium-backend.<your-subdomain>.workers.dev`

### Deploy Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variable in Vercel dashboard:
# VITE_API_URL = https://notarium-backend.<your-subdomain>.workers.dev
```

### Update CORS & OAuth

1. **Backend CORS** - Update `src/index.ts`:
```typescript
origin: ['https://your-vercel-domain.vercel.app']
```

2. **Google OAuth** - Add redirect URI:
```
https://your-vercel-domain.vercel.app/auth/callback
```

---

## 🔒 Security

### Environment Variables

**Never commit these files:**
- `.env`
- `.dev.vars`
- `.env.local`

### JWT Secret

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### CORS Configuration

Only allow your domains:
```typescript
origin: [
  'http://localhost:5173',  // Development
  'https://notarium.vercel.app'  // Production
]
```

---

## 📊 Database Schema

### Users
- `id`, `email`, `display_name`, `photo_url`
- `role`, `points`, `notes_count`, `class`

### Notes
- `id`, `author_id`, `title`, `content`
- `subject`, `tags`, `views`, `rating_avg`
- `is_public`, `created_at`, `updated_at`

### Subjects
- `id`, `name`, `icon`, `note_count`

### Chat Sessions & Messages
- AI study assistant data

### Ratings, Comments, Versions
- Note interactions

---

## 🎨 UI Components

### Pages
- **Login** - Google OAuth sign-in
- **Auth Callback** - OAuth redirect handler
- **Home/Dashboard** - Main application

### Features
- Glass-morphism design
- Dark theme (SpaceX-inspired)
- Responsive layout
- Loading states
- Error handling
- Smooth animations

---

## 🧪 Testing

### Test Backend API

```bash
# Health check
curl http://localhost:8787/api/health

# Get subjects
curl http://localhost:8787/api/subjects

# Get notes
curl http://localhost:8787/api/notes
```

### Test OAuth Flow

1. Visit http://localhost:5173
2. Click "Sign in with Google"
3. Complete Google authentication
4. Redirect to dashboard
5. Check localStorage for token

---

## 🐛 Troubleshooting

### Common Issues

**1. CORS Error**
- Check backend `origin` array
- Verify frontend URL matches exactly

**2. OAuth Fails**
- Verify Google Console redirect URIs
- Check `FRONTEND_URL` in `.dev.vars`
- Ensure credentials are correct

**3. Database Error**
- Re-run `npm run db:local`
- Check `wrangler.toml` database_id
- Verify binding name is "DB"

**4. Token Invalid**
- Clear localStorage: `localStorage.clear()`
- Generate new JWT_SECRET
- Re-deploy backend

**5. Build Fails**
- Delete `node_modules` and reinstall
- Check Node.js version (20+)
- Clear Vite cache: `rm -rf node_modules/.vite`

---

## 📦 API Endpoints

### Public Endpoints
- `GET /` - Health check
- `GET /api/health` - API status
- `GET /api/auth/google` - Start OAuth flow
- `POST /api/auth/callback` - OAuth callback
- `GET /api/subjects` - List subjects
- `GET /api/notes` - List public notes
- `GET /api/notes/:id` - Get single note

### Protected Endpoints (require JWT)
- `GET /api/auth/me` - Current user
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `POST /api/chat/session` - Create chat session
- `POST /api/chat/message` - Send message

---

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ OAuth authentication
- ✅ Notes CRUD
- ✅ Subject filtering
- ✅ User dashboard

### Phase 2 (Next)
- [ ] File uploads (Cloudflare R2)
- [ ] Rich text editor (TipTap)
- [ ] Search functionality
- [ ] Note bookmarks

### Phase 3 (Future)
- [ ] AI note summarization
- [ ] Study assistant chatbot
- [ ] Real-time collaboration
- [ ] Email notifications
- [ ] Mobile app

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

MIT License - feel free to use for learning and projects!

---

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by note-taking apps like Notion, Obsidian
- Uses Cloudflare's edge network for speed
- Designed with students in mind

---

## 📞 Support

Having issues? Check:
1. Browser console (F12)
2. Cloudflare Workers logs (dashboard)
3. Environment variables
4. OAuth configuration

---

**Built with ❤️ for students everywhere. Happy studying! 📚**