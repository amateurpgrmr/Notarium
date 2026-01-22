# Notarium+ Complete Documentation
> **Purpose:** This is a comprehensive reference document containing all information about the Notarium+ project. Used for providing full context when editing the codebase.

**Last Updated:** January 22, 2026

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technical Architecture](#technical-architecture)
3. [Security Implementation](#security-implementation)
4. [Deployment & Infrastructure](#deployment--infrastructure)
5. [Development Workflow](#development-workflow)
6. [Database Schema & Migrations](#database-schema--migrations)
7. [API Endpoints](#api-endpoints)
8. [Testing & Verification](#testing--verification)
9. [Project Structure](#project-structure)

---

## Project Overview

### What is Notarium+?

Notarium+ is a modern, AI-powered note-sharing platform designed to help students learn smarter through intelligent study tools and collaborative learning.

**Live Demo:** https://notarium-site.vercel.app
**Backend API:** https://notarium-backend.notarium-backend.workers.dev

### Why It Was Built

As a student project, Notarium+ addresses the challenges of organizing notes across different subjects and the need for 24/7 AI tutor availability. Traditional note-taking apps lacked intelligent features, and AI chat tools didn't integrate with study materials.

**Key Engineering Challenge:** Building a scalable, real-time platform with OCR, AI chat, and gamification while maintaining sub-200ms response times and enterprise-grade security.

### Core Features

#### Functional Features
- **Smart Note Management** - Upload, organize, and share notes with OCR text extraction
- **AI Study Assistant** - Powered by DeepSeek/Gemini for summaries, quizzes, and study plans
- **Real-time Collaboration** - Share notes across classes and subjects
- **Gamification System** - Points, diamonds, and leaderboards to motivate learning
- **Advanced Search** - Filter by subject, tags, or content with instant results

#### Technical Features
- **OCR Technology** - Extract text from handwritten notes and photos
- **Responsive Design** - Mobile-first with touch-optimized gestures
- **Admin Dashboard** - User management, content moderation, and analytics
- **Error Boundaries** - Graceful error handling with detailed dev feedback
- **Type Safety** - Strict TypeScript with zero `any` types

---

## Technical Architecture

### Tech Stack

#### Frontend
| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| **React 19** | UI Framework | Latest features, concurrent rendering, server components ready |
| **TypeScript** | Type Safety | Catch errors at compile-time, better DX with IntelliSense |
| **Vite** | Build Tool | Lightning-fast HMR, optimized production builds |
| **Tailwind CSS** | Styling | Rapid UI development, consistent design system |
| **Framer Motion** | Animations | Smooth, performant animations for better UX |
| **Radix UI** | Components | Accessible, unstyled components as foundation |

#### Backend
| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| **Cloudflare Workers** | Serverless Runtime | Edge computing, zero cold starts, global distribution |
| **Hono** | Web Framework | Fastest edge-native framework, Express-like DX |
| **D1 Database** | SQLite Storage | Integrated with Workers, zero-config setup |
| **Cloudflare KV** | Rate Limiting | Distributed key-value store for global rate limits |

#### AI & Security
| Technology | Purpose |
|------------|---------|
| **DeepSeek API** | AI chat, summaries, quiz generation |
| **Gemini 2.0 Flash** | OCR, text extraction, study plans |
| **bcrypt** | Password hashing (10 salt rounds) |
| **jose** | JWT signing and verification (HS256) |
| **zod** | Runtime schema validation |

### System Architecture Diagram

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
│  │    External APIs (DeepSeek AI / Gemini)        │    │
│  │  • Chat completions                             │    │
│  │  • OCR text extraction                          │    │
│  │  • Study plan generation                        │    │
│  └────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### Data Flow
1. User uploads note → Frontend compresses image → API extracts text via OCR
2. User sends chat message → API forwards to DeepSeek/Gemini → Streams response back
3. All requests authenticated via JWT → Rate limited by IP → Validated with Zod schemas

---

## Security Implementation

### Enterprise-Grade Security Features

Notarium+ implements 10 critical security features with a security grade improvement from D+ to B+.

| Feature | Implementation | Status |
|---------|----------------|--------|
| **Password Hashing** | bcrypt with 10 salt rounds | ✅ DEPLOYED |
| **Authentication** | JWT with HS256, 24-hour expiration | ✅ DEPLOYED |
| **Rate Limiting** | 5 attempts per 15 minutes via Cloudflare KV | ✅ DEPLOYED |
| **Input Validation** | Zod schemas for all user inputs | ✅ DEPLOYED |
| **CORS Protection** | Restricted to authorized origins | ✅ DEPLOYED |
| **Security Headers** | CSP, X-Frame-Options, HSTS, X-Content-Type-Options | ✅ DEPLOYED |
| **Request Size Limits** | 10MB max payload | ✅ DEPLOYED |
| **AI Safety** | Prompt injection detection | ✅ CODE READY |
| **Secret Management** | Wrangler secrets (never committed) | ✅ DEPLOYED |
| **Token Expiration** | 24 hours for JWT tokens | ✅ DEPLOYED |

### Password Hashing (bcrypt)

**Functions:**
- `hashPassword(password: string)` - Hashes passwords with 10 salt rounds
- `verifyPassword(password: string, hash: string)` - Verifies password against hash

**Implementation:**
```typescript
import bcrypt from 'bcryptjs';

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

### JWT Authentication

**Token Structure:**
```json
{
  "id": 55,
  "email": "user@example.com",
  "role": "student",
  "iat": 1763363962,
  "exp": 1763450362
}
```

**Functions:**
- `createToken(payload)` - Creates JWT with HS256
- `verifyToken(token)` - Verifies and decodes JWT

### Rate Limiting

**Configuration:**
- 5 attempts per 15 minutes per IP
- Uses Cloudflare KV for distributed rate limiting
- Applied to signup and login endpoints

**KV Namespace:**
- Production ID: `5d033dba4be2443e98c4782d44e0b777`
- Preview ID: `ad6509290e94483f9467a11eb2fff1b8`

### Input Validation (Zod)

**Schemas:**
```typescript
// Signup Schema
const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8)
});

// Login Schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
```

**Example Error Response:**
```json
{
  "error": "Invalid input",
  "details": [{
    "code": "too_small",
    "minimum": 8,
    "message": "String must contain at least 8 character(s)",
    "path": ["password"]
  }]
}
```

### Security Headers

All responses include:
- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`

### AI Prompt Injection Protection

**Function:** `sanitizeAIInput(input: string)`

Removes:
- System/assistant/user prefixes
- Special tokens (`<|im_start|>`, `<|im_end|>`)
- Instruction markers

**Usage:**
```typescript
const sanitizedMessage = sanitizeAIInput(userMessage);
// Send sanitizedMessage to AI API
```

### Environment Secrets

**Required Secrets:**
```bash
JWT_SECRET=your_secret_here
ADMIN_PASSWORD=your_password_here
DEEPSEEK_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

**Setting Secrets:**
```bash
wrangler secret put JWT_SECRET
wrangler secret put ADMIN_PASSWORD
wrangler secret put DEEPSEEK_API_KEY
wrangler secret put GEMINI_API_KEY
```

### Password Migration

**Critical:** Existing users have plain-text passwords that must be migrated.

**Migration Endpoint (Temporary):**
```typescript
if (path === '/api/admin/migrate-passwords' && request.method === 'POST') {
  const { adminPassword } = await request.json() as any;

  if (adminPassword !== env.ADMIN_PASSWORD) {
    return jsonResponse({ error: 'Unauthorized' }, 401, env);
  }

  const users = await env.DB.prepare('SELECT id, password_hash FROM users').all();
  let migrated = 0;

  for (const user of users.results) {
    const userId = (user as any).id;
    const plainPassword = (user as any).password_hash;

    if (plainPassword && !plainPassword.startsWith('$2')) {
      const hashed = await hashPassword(plainPassword);
      await env.DB.prepare(
        'UPDATE users SET password_hash = ? WHERE id = ?'
      ).bind(hashed, userId).run();
      migrated++;
    }
  }

  return jsonResponse({
    success: true,
    migrated,
    total: users.results.length
  }, 200, env);
}
```

---

## Deployment & Infrastructure

### Production URLs

- **Frontend:** https://notarium-site.vercel.app
- **Backend:** https://notarium-backend.notarium-backend.workers.dev
- **Repository:** https://github.com/amateurpgrmr/Notarium

### Deployment Status

**Date:** November 17, 2025
**Worker Version:** 84a1ad28-147b-4536-a56d-b596863704ae
**Bundle Size:** 368.42 KiB (gzip: 69.08 KiB)
**Database Size:** 25.94 MB
**Tables:** 9 (including refresh_tokens table)

### Frontend Deployment (Vercel)

**Option A: Vercel CLI**
```bash
cd /path/to/Notarium-main
npm install
npm run build:frontend
vercel
```

**Option B: GitHub Integration**
1. Push code to GitHub
2. Go to https://vercel.com/dashboard
3. Click "Add New" → "Project"
4. Select GitHub repository
5. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
6. Add environment variables
7. Deploy

**Environment Variables:**
```env
VITE_API_URL=https://notarium-backend.notarium-backend.workers.dev
```

### Backend Deployment (Cloudflare Workers)

```bash
cd backend
npm install
npm run deploy
```

**Secrets to Set:**
```bash
wrangler secret put DEEPSEEK_API_KEY
wrangler secret put GEMINI_API_KEY
wrangler secret put JWT_SECRET
wrangler secret put ADMIN_PASSWORD
```

### Database Setup

**Cloudflare D1 Configuration:**
```toml
[[d1_databases]]
binding = "DB"
database_name = "notarium-db"
database_id = "your_database_id"

[[env.development.d1_databases]]
binding = "DB"
database_name = "notarium-db-local"
database_id = "local"
```

### KV Namespace Setup

```bash
npx wrangler kv:namespace create RATE_LIMIT
npx wrangler kv:namespace create RATE_LIMIT --preview
```

**Update wrangler.toml:**
```toml
[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "5d033dba4be2443e98c4782d44e0b777"

[[env.development.kv_namespaces]]
binding = "RATE_LIMIT"
preview_id = "ad6509290e94483f9467a11eb2fff1b8"
```

### Performance Metrics

- **First Contentful Paint:** < 1.2s
- **Time to Interactive:** < 2.5s
- **API Response Time:** < 200ms (global edge network)
- **Lighthouse Score:** 95+ (Performance, Accessibility, Best Practices)

---

## Development Workflow

### Prerequisites

- Node.js 18+ and npm
- Git
- Cloudflare account (for deployment)
- DeepSeek API key (for AI features)
- Gemini API key (for OCR features)

### Local Development Setup

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

**Environment Variables (.env):**
```env
# Backend API URL (development)
VITE_API_URL=http://localhost:8787

# DeepSeek AI API Key
DEEPSEEK_API_KEY=your_api_key_here

# Gemini AI API Key
GEMINI_API_KEY=your_api_key_here

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_secret_here

# Admin Password
ADMIN_PASSWORD=your_admin_password
```

### Development Commands

```bash
# Frontend development
npm run dev:frontend  # Runs on http://localhost:5173

# Backend development
npm run dev:backend   # Runs on http://localhost:8787

# Both simultaneously
npm run dev

# Build
npm run build         # Builds both frontend and backend
npm run build:frontend
npm run build:backend

# Deploy
npm run deploy        # Deploys both
npm run deploy:frontend
npm run deploy:backend

# Utilities
npm run test
npm run lint
npm run clean         # Removes node_modules and dist folders
```

### Branch Naming Convention

- `feature/` - New features (e.g., `feature/add-quiz-mode`)
- `fix/` - Bug fixes (e.g., `fix/login-redirect`)
- `docs/` - Documentation updates (e.g., `docs/update-api-reference`)
- `refactor/` - Code refactoring (e.g., `refactor/extract-auth-hooks`)
- `test/` - Test additions/modifications (e.g., `test/add-note-tests`)

### Commit Message Format

Following [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semi-colons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Example:**
```
feat(notes): add markdown preview mode

- Implement real-time markdown rendering
- Add toggle button in note editor
- Include syntax highlighting for code blocks

Closes #123
```

### Code Style Standards

#### TypeScript
- **Strict mode enabled** - No `any` types allowed (use `unknown` if necessary)
- **Explicit return types** on all exported functions
- **Named exports** preferred over default exports
- **Interface over type** for object shapes

#### React Components
- **Functional components only** (no class components)
- **Custom hooks** for reusable logic
- **Named exports** for components
- **Props interface** defined above component

#### File Organization
- **One component per file**
- **Colocate related files** (component + styles + tests)
- **Index files** for clean imports

---

## Database Schema & Migrations

### Tables

1. **users** - User accounts
2. **notes** - Uploaded notes
3. **subjects** - 14 Indonesian subjects
4. **chat_sessions** - AI tutor sessions
5. **chat_messages** - Chat history
6. **refresh_tokens** - Token refresh mechanism
7. **note_tags** - Tags for notes
8. **likes** - Note likes
9. **comments** - Note comments

### Users Table Schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'student' CHECK(role IN ('student', 'teacher', 'admin')),
  class TEXT CHECK(class IN ('10.1', '10.2', '10.3', '11.1', '11.2', '11.3', '12.1', '12.2', '12.3') OR class IS NULL),
  points INTEGER DEFAULT 0,
  diamonds INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Notes Table Schema

```sql
CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  author_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  extracted_text TEXT,
  image_url TEXT,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);
```

### Migration Files

#### 0001_allow_null_class.sql
```sql
-- Allow NULL values for class field to support admin users
ALTER TABLE users MODIFY class TEXT CHECK(
  class IN ('10.1', '10.2', '10.3', '11.1', '11.2', '11.3', '12.1', '12.2', '12.3')
  OR class IS NULL
);
```

#### 0008_add_refresh_tokens.sql
```sql
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

### Running Migrations

**Production:**
```bash
cd backend
npm run migrate
# or
wrangler d1 execute notarium-db --file=migrations/0001_allow_null_class.sql
```

**Local Development:**
```bash
npm run migrate:local
# or
wrangler d1 execute notarium-db-local --local --file=migrations/0001_allow_null_class.sql
```

**Via Cloudflare Dashboard:**
1. Go to Workers & Pages > D1 > notarium-db > Console
2. Copy migration SQL
3. Paste and execute

---

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/signup`
Create new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123",
  "class": "10.1"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

#### POST `/api/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

### Notes Endpoints

#### GET `/api/notes`
Get all notes with optional filtering.

**Query Parameters:**
- `subject_id` - Filter by subject
- `author_id` - Filter by author
- `search` - Search in title/description

#### POST `/api/notes`
Create new note.

**Request:**
```json
{
  "title": "Photosynthesis Notes",
  "description": "Biology chapter 5",
  "subject_id": 4,
  "extracted_text": "Photosynthesis is...",
  "image_url": "https://..."
}
```

#### GET `/api/notes/:id`
Get single note by ID.

#### PUT `/api/notes/:id`
Update note (author only).

#### DELETE `/api/notes/:id`
Delete note (author or admin only).

### AI Endpoints

#### POST `/api/chat/sessions`
Create new chat session.

**Request:**
```json
{
  "subject": "Mathematics",
  "topic": "Calculus - Derivatives"
}
```

**Response:**
```json
{
  "session": {
    "id": 1,
    "user_id": 1,
    "subject": "Mathematics",
    "topic": "Calculus - Derivatives",
    "created_at": "2025-11-03T01:24:00.790Z"
  }
}
```

#### POST `/api/chat/sessions/:id/messages`
Send message and get AI response.

**Request:**
```json
{
  "role": "user",
  "content": "What is the derivative of x^2?"
}
```

**Response:**
```json
{
  "message": {
    "id": 1,
    "session_id": 1,
    "role": "assistant",
    "content": "The derivative of x^2 is 2x. Here's why...",
    "timestamp": "2025-11-03T01:25:00.000Z"
  }
}
```

#### POST `/api/gemini/ocr`
Extract text from image using OCR.

**Request:**
```json
{
  "image": "base64_encoded_image_data"
}
```

**Response:**
```json
{
  "success": true,
  "text": "Extracted text from the image..."
}
```

#### POST `/api/gemini/summarize`
Generate summary of content.

**Request:**
```json
{
  "content": "Long text to summarize..."
}
```

**Response:**
```json
{
  "summary": "Brief 3-4 sentence summary..."
}
```

#### POST `/api/gemini/quick-summary`
Generate 1-sentence summary for note uploads.

#### POST `/api/gemini/auto-tags`
Auto-generate tags from content.

### Admin Endpoints

#### POST `/api/admin/verify`
Verify admin credentials.

#### POST `/api/admin/upvote-note/:id`
Admin-only upvote for quality notes.

---

## Testing & Verification

### Test Results Summary

**Date:** November 3, 2025
**Status:** ✅ ALL TESTS PASSED

| Feature | Response Time | Status |
|---------|--------------|--------|
| Chat (AI Response) | ~2-4 seconds | ✅ Good |
| OCR Processing | < 1 second | ✅ Good |
| Summary Generation | ~2-3 seconds | ✅ Good |
| Note Analysis | ~3-4 seconds | ✅ Good |
| Session Creation | < 500ms | ✅ Excellent |

### Security Testing

✅ New user signup creates bcrypt hash
✅ Login works with bcrypt verification
✅ JWT tokens expire after 24 hours
✅ Invalid/expired tokens return 401
✅ Rate limiting blocks after 5 attempts
✅ CORS blocks requests from unauthorized origins
✅ Input validation rejects invalid data
✅ Security headers present in responses
✅ Admin login uses environment password
✅ Request size limit blocks large payloads

### Manual Testing Checklist

**Authentication Flow:**
- [ ] Sign up with test account
- [ ] Login with credentials
- [ ] Verify JWT token in localStorage

**Note Management:**
- [ ] Upload note with image (OCR)
- [ ] Auto-summary generates
- [ ] Auto-tags generate
- [ ] Note appears in list

**AI Features:**
- [ ] Create chat session
- [ ] Send message to AI tutor
- [ ] Receive educational response
- [ ] Generate quiz from notes
- [ ] Create study plan

**Admin Features:**
- [ ] Login with admin account
- [ ] Admin upvote button appears
- [ ] User management works
- [ ] Content moderation works

---

## Project Structure

```
notarium/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (Radix + custom)
│   │   └── modals/         # Modal components
│   ├── pages/              # Route pages
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Authentication state
│   │   ├── useNotes.ts     # Notes management
│   │   └── useDebounce.ts  # Debounced values
│   ├── types/              # TypeScript type definitions
│   │   ├── user.ts         # User types
│   │   ├── note.ts         # Note types
│   │   └── index.ts        # Central exports
│   ├── lib/                # Utilities and API client
│   │   └── api.ts          # Centralized API requests
│   ├── api/                # API reserved directory
│   ├── layouts/            # Layout reserved directory
│   ├── store/              # Store reserved directory
│   ├── styles/             # Styles reserved directory
│   └── theme.ts            # Design system tokens
├── backend/                # Cloudflare Workers backend
│   ├── src/
│   │   └── index.ts        # API routes and handlers
│   ├── migrations/         # Database migration files
│   │   ├── README.md
│   │   ├── 0001_allow_null_class.sql
│   │   └── 0008_add_refresh_tokens.sql
│   ├── MIGRATION_GUIDE.md
│   └── SECURITY_SETUP.md
├── public/                 # Static assets
│   ├── per.1.jpg           # Founder photo 1
│   ├── per.2.jpg           # Founder photo 2
│   ├── per.3.jpg           # Founder photo 3
│   ├── per.4.jpg           # Founder photo 4
│   └── per.5.jpg           # Founder photo 5
├── .github/                # GitHub workflows
├── prisma/                 # Prisma schema (if used)
├── dist/                   # Build output
├── node_modules/           # Dependencies
├── .env.example            # Environment template
├── .eslintrc.json          # ESLint config
├── .gitignore              # Git ignore rules
├── .node-version           # Node version (18+)
├── .prettierrc             # Prettier config
├── .vercelignore           # Vercel ignore rules
├── components.json         # Component config
├── CONTRIBUTING.md         # Contribution guidelines
├── DEPLOYMENT_COMPLETE.md  # Deployment verification
├── DEPLOYMENT_GUIDE.md     # Deployment instructions
├── FOUNDERS_PHOTOS_README.md # Founder photos setup
├── index.html              # HTML entry point
├── LICENSE                 # MIT License
├── package.json            # NPM dependencies
├── package-lock.json       # NPM lock file
├── postcss.config.js       # PostCSS config
├── QUICK_START.md          # Quick start guide
├── README.md               # Main documentation
├── tailwind.config.js      # Tailwind config
├── TEST_RESULTS.md         # Test results
├── tsconfig.json           # TypeScript config
├── vercel.json             # Vercel config
├── vite.config.ts          # Vite config
└── wrangler.toml           # Cloudflare Workers config
```

---

## Founders Feature

The platform includes a "Meet the Founders" feature accessible via footer button.

### Required Photos

Add these images to `/public`:
- `per.1.jpg` - Founder 1 photo
- `per.2.jpg` - Founder 2 photo
- `per.3.jpg` - Founder 3 photo
- `per.4.jpg` - Founder 4 photo
- `per.5.jpg` - Founder 5 photo

**Image Specifications:**
- Format: JPG or PNG
- Dimensions: Square aspect ratio (500x500px or 1000x1000px)
- Size: Keep under 500KB for optimal performance
- Style: Professional headshots with good lighting

### Customizing Founder Information

Edit the founders array in `src/components/FoundersModal.tsx`:

```typescript
const founders: Founder[] = [
  {
    name: 'Your Name',
    role: 'Your Role',
    contribution: 'Brief description of their contribution.',
    photo: '/per.1.jpg'
  },
  // ... etc
];
```

### Features

**Desktop View:**
- Shows all founder information at once
- Hover effects on cards
- Contribution displayed in highlighted boxes

**Mobile View:**
- Compact list showing photo and name
- Tap to expand and see role/contribution
- Smooth expand/collapse animations
- Visual indicator (arrow) shows expand state

---

## AI Integration Details

### DeepSeek API

**Purpose:** AI chat tutor, summaries, quiz generation

**Features:**
- Context-aware conversations
- Educational explanations
- Step-by-step problem solving
- Quiz generation
- Study plan creation

**System Prompt:**
```
You are an educational AI tutor for high school students.
Provide clear, step-by-step explanations.
Use examples and break down complex concepts.
Be encouraging and patient.
```

### Gemini 2.0 Flash API

**Purpose:** OCR text extraction, image analysis

**Features:**
- Extract text from handwritten notes
- Extract text from typed documents
- Extract text from photos
- Image content analysis

**API Key Management:**
- Development: Store in `.env.local`
- Production: Use `wrangler secret put GEMINI_API_KEY`
- Monitor usage: https://console.cloud.google.com/

### AI Safety

**Prompt Injection Protection:**
```typescript
function sanitizeAIInput(input: string): string {
  return input
    .replace(/^\s*(system|assistant|user):/gim, '')
    .replace(/<\|im_start\|>|<\|im_end\|>/g, '')
    .replace(/\[INST\]|\[\/INST\]/g, '')
    .trim();
}
```

**Apply to all user inputs before sending to AI:**
- Chat messages
- Note content for summarization
- Quiz generation inputs
- Study plan requests

---

## Performance Optimization

### Frontend Optimization
- Vite for lightning-fast HMR
- Code splitting by route
- Lazy loading for heavy components
- Image optimization
- Bundle size: ~83KB gzipped

### Backend Optimization
- Cloudflare Workers edge computing
- Zero cold starts
- Global distribution (200+ cities)
- Sub-200ms response times
- Database queries optimized with indexes

### Caching Strategy
- Static assets cached at CDN
- API responses cached when appropriate
- Rate limit state in Cloudflare KV
- Session data in D1 database

---

## Troubleshooting

### Common Issues

#### "Cannot connect to backend"
- Check if backend is running: `curl http://localhost:8787`
- Verify `VITE_API_URL` environment variable
- Check CORS settings in backend

#### "Image not uploading"
- Ensure image has clear, readable text
- Try different image format (JPG, PNG)
- Check browser console for errors
- Verify image size < 10MB

#### "AI not responding"
- Check internet connection
- Verify API key is valid
- Check browser console for error messages
- Monitor API quota/limits

#### "Port 8787 already in use"
```bash
pkill -f "node dev-server.js"
sleep 2
cd backend && npm run dev
```

#### "Admin login failing with constraint error"
- Run migration: `npm run migrate`
- Error was: `CHECK constraint failed: class IN ('10.1', '10.2', '10.3')`
- Fix: Allow NULL values for admin users

#### "Build fails on Vercel"
- Check Node version (needs 18+)
- Ensure all dependencies installed: `npm install`
- Check TypeScript errors: `npx tsc --noEmit`

---

## Future Roadmap

- [ ] Real-time collaborative editing (WebSockets)
- [ ] Offline mode with service workers
- [ ] Mobile apps (React Native)
- [ ] Advanced analytics dashboard
- [ ] Third-party integrations (Google Drive, Notion)
- [ ] Refresh token endpoints implementation
- [ ] 2FA/MFA authentication
- [ ] Password reset flow
- [ ] Session management
- [ ] Audit logging
- [ ] CAPTCHA integration
- [ ] IP allowlisting for admin

---

## License

MIT License - Copyright (c) 2026 Notarium+

---

**Document Version:** 1.0
**Last Updated:** January 22, 2026
**Maintained By:** Project Team
