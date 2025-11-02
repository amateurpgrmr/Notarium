# Notarium+ Project Structure

```
Notarium+/
├── src/                          # Frontend source (React + TypeScript)
│   ├── pages/
│   │   ├── Login.tsx            # Independent login page
│   │   ├── Signup.tsx           # Signup page
│   │   └── AuthCallback.tsx      # OAuth callback handler
│   ├── components/
│   │   ├── ui/                  # Reusable UI components
│   │   └── ChatInput.tsx         # Chat component
│   ├── styles/
│   │   └── login.css            # Login & signup styles
│   ├── lib/
│   │   └── api.ts               # API client utilities
│   ├── App.tsx                  # Main app component
│   └── main.tsx                 # Entry point
│
├── backend/                      # Cloudflare Workers backend
│   ├── src/
│   │   ├── index.ts             # Main backend server
│   │   ├── auth.ts              # Authentication endpoints
│   │   └── routes/              # Additional API routes
│   ├── middleware/
│   │   └── auth.ts              # JWT verification
│   ├── schema.sql               # Database schema
│   ├── wrangler.toml            # Cloudflare config
│   └── package.json
│
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── DEPLOYMENT.md                # Deployment guide
├── PROJECT_STRUCTURE.md         # This file
├── package.json                 # Root package.json
├── vercel.json                  # Vercel deployment config
└── README.md                    # Project README
```

## Key Features

- **Independent Authentication**: Self-hosted login without YouWare dependency
- **Modern UI**: Dark theme with glassmorphism design
- **Responsive Design**: Mobile-first approach
- **Secure**: JWT-based authentication with secure token storage
- **Scalable**: Cloudflare Workers backend with D1 database
- **Easy Deployment**: One-command deployment to Vercel/Cloudflare

## Technologies

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Hono, Cloudflare Workers, D1
- **Database**: SQLite (D1)
- **Auth**: JWT tokens
- **Styling**: CSS3, Glassmorphism
- **Hosting**: Vercel (frontend), Cloudflare (backend)
