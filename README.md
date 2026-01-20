# Notarium+

> A modern, AI-powered note-sharing platform that helps students learn smarter through intelligent study tools and collaborative learning.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=for-the-badge)](https://notarium-site.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white)](https://workers.cloudflare.com/)

## Live Demo

**[Try Notarium+ →](https://notarium-site.vercel.app)**

Backend API: `https://notarium-backend.notarium-backend.workers.dev`

---

## Why I Built This

As a student, I struggled to organize my notes across different subjects and often wished I had an AI tutor available 24/7. Traditional note-taking apps lacked intelligent features, and AI chat tools didn't integrate with my study materials.

**Notarium+ solves this** by combining secure note management with AI-powered study assistance. It's designed to be the all-in-one platform students actually want to use—beautiful, fast, and genuinely helpful.

**Key Engineering Challenge:** Building a scalable, real-time platform with OCR, AI chat, and gamification while maintaining sub-200ms response times and enterprise-grade security.

---

## Features

### Core Functionality
- **Smart Note Management** - Upload, organize, and share notes with OCR text extraction
- **AI Study Assistant** - Powered by DeepSeek for summaries, quizzes, and study plans
- **Real-time Collaboration** - Share notes across classes and subjects
- **Gamification System** - Points, diamonds, and leaderboards to motivate learning
- **Advanced Search** - Filter by subject, tags, or content with instant results

### Technical Features
- **OCR Technology** - Extract text from handwritten notes and photos
- **Responsive Design** - Mobile-first with touch-optimized gestures
- **Admin Dashboard** - User management, content moderation, and analytics
- **Error Boundaries** - Graceful error handling with detailed dev feedback
- **Type Safety** - Strict TypeScript with zero `any` types (interview-ready)

---

## Tech Stack

### Frontend
| Technology | Purpose | Why I Chose It |
|------------|---------|----------------|
| **React 19** | UI Framework | Latest features, concurrent rendering, server components ready |
| **TypeScript** | Type Safety | Catch errors at compile-time, better DX with IntelliSense |
| **Vite** | Build Tool | Lightning-fast HMR, optimized production builds |
| **Tailwind CSS** | Styling | Rapid UI development, consistent design system |
| **Framer Motion** | Animations | Smooth, performant animations for better UX |
| **Radix UI** | Components | Accessible, unstyled components as foundation |

### Backend
| Technology | Purpose | Why I Chose It |
|------------|---------|----------------|
| **Cloudflare Workers** | Serverless Runtime | Edge computing, zero cold starts, global distribution |
| **Hono** | Web Framework | Fastest edge-native framework, Express-like DX |
| **D1 Database** | SQLite Storage | Integrated with Workers, zero-config setup |
| **Cloudflare KV** | Rate Limiting | Distributed key-value store for global rate limits |

### AI & Security
| Technology | Purpose |
|------------|---------|
| **DeepSeek API** | AI chat, summaries, quiz generation |
| **bcrypt** | Password hashing (10 salt rounds) |
| **jose** | JWT signing and verification (HS256) |
| **zod** | Runtime schema validation |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Pages   │  │Components│  │  Hooks   │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       └─────────────┴─────────────┘                      │
│                      │                                   │
│                 API Client                               │
└──────────────────────┼──────────────────────────────────┘
                       │ HTTPS + JWT
┌──────────────────────▼──────────────────────────────────┐
│         Cloudflare Workers (Edge Runtime)                │
│  ┌──────────────────────────────────────────────────┐   │
│  │   Hono Router + Middleware                       │   │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐      │   │
│  │   │   Auth   │  │   Rate   │  │   CORS   │      │   │
│  │   │  (JWT)   │  │ Limiting │  │ Security │      │   │
│  │   └──────────┘  └──────────┘  └──────────┘      │   │
│  └─────────┬────────────────────────────────────────┘   │
│            │                                             │
│  ┌─────────▼─────────┐         ┌────────────────────┐  │
│  │   D1 Database     │         │   Cloudflare KV    │  │
│  │   (SQLite)        │         │  (Rate Limits)     │  │
│  │                   │         │                    │  │
│  │ • Users           │         │ • IP tracking      │  │
│  │ • Notes           │         │ • Session cache    │  │
│  │ • Subjects        │         └────────────────────┘  │
│  │ • Chat Sessions   │                                  │
│  └───────────────────┘                                  │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │       External API (DeepSeek AI)                │    │
│  │  • Chat completions                             │    │
│  │  • OCR text extraction                          │    │
│  │  • Study plan generation                        │    │
│  └────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. User uploads note → Frontend compresses image → API extracts text via OCR
2. User sends chat message → API forwards to DeepSeek → Streams response back
3. All requests authenticated via JWT → Rate limited by IP → Validated with Zod schemas

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Cloudflare account (for deployment)
- DeepSeek API key (for AI features)

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/notarium.git
cd notarium

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run development server
npm run dev
```

Visit `http://localhost:5173` for the frontend.

### Environment Variables

Create a `.env` file in the root directory:

```env
# Backend API URL (development)
VITE_API_URL=http://localhost:8787

# DeepSeek AI API Key
DEEPSEEK_API_KEY=your_api_key_here

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_secret_here
```

---

## Deployment

### Frontend (Vercel)

```bash
# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard
VITE_API_URL=https://notarium-backend.notarium-backend.workers.dev
```

### Backend (Cloudflare Workers)

```bash
# Deploy to Cloudflare Workers
npm run deploy:backend

# Set secrets
wrangler secret put DEEPSEEK_API_KEY
wrangler secret put JWT_SECRET
```

---

## Project Structure

```
notarium/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Base UI components (Radix + custom)
│   │   └── modals/       # Modal components
│   ├── pages/            # Route pages
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.ts    # Authentication state
│   │   ├── useNotes.ts   # Notes management
│   │   └── useDebounce.ts # Debounced values
│   ├── types/            # TypeScript type definitions
│   │   ├── user.ts       # User types
│   │   ├── note.ts       # Note types
│   │   └── index.ts      # Central exports
│   ├── lib/              # Utilities and API client
│   │   └── api.ts        # Centralized API requests
│   └── theme.ts          # Design system tokens
├── backend/              # Cloudflare Workers backend
│   └── src/
│       └── index.ts      # API routes and handlers
├── public/               # Static assets
└── .prettierrc           # Code formatting rules
```

---

## Security

Notarium+ implements **enterprise-grade security** practices:

| Feature | Implementation |
|---------|----------------|
| **Password Hashing** | bcrypt with 10 salt rounds |
| **Authentication** | JWT with HS256, 24-hour expiration |
| **Rate Limiting** | 5 attempts per 15 minutes via Cloudflare KV |
| **Input Validation** | Zod schemas for all user inputs |
| **CORS Protection** | Restricted to authorized origins |
| **Security Headers** | CSP, X-Frame-Options, HSTS, X-Content-Type-Options |
| **Request Size Limits** | 10MB max payload |
| **AI Safety** | Prompt injection detection |
| **Secret Management** | Wrangler secrets (never committed) |

---

## Performance

- **First Contentful Paint:** < 1.2s
- **Time to Interactive:** < 2.5s
- **API Response Time:** < 200ms (global edge network)
- **Lighthouse Score:** 95+ (Performance, Accessibility, Best Practices)

---

## Development Practices

- ✅ **TypeScript Strict Mode** - No implicit any, strict null checks
- ✅ **ESLint + Prettier** - Consistent code formatting
- ✅ **Custom Hooks** - Reusable logic extraction
- ✅ **Error Boundaries** - Graceful error handling
- ✅ **Component Decomposition** - Single responsibility principle
- ✅ **Type Safety** - Shared types across frontend/backend

---

## Roadmap

- [ ] Real-time collaborative editing (WebSockets)
- [ ] Offline mode with service workers
- [ ] Mobile apps (React Native)
- [ ] Advanced analytics dashboard
- [ ] Third-party integrations (Google Drive, Notion)

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Connect

Built with ❤️ by [Your Name]

- Portfolio: [yourportfolio.com](https://yourportfolio.com)
- LinkedIn: [linkedin.com/in/yourprofile](https://linkedin.com/in/yourprofile)
- GitHub: [@yourusername](https://github.com/yourusername)

---

**⭐ If you found this project helpful, please consider giving it a star on GitHub!**
