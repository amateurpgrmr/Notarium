# Notarium+ Deployment Guide

## Prerequisites
- Node.js 18+ and npm/pnpm
- Cloudflare account (for Workers backend)
- Google OAuth credentials (optional)
- Gemini API key (optional)

## Local Development

### 1. Setup Environment
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 2. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 3. Start Development Servers

**Frontend:**
```bash
npm run dev:frontend
# Runs on http://localhost:5173
```

**Backend:**
```bash
npm run dev:backend
# Runs on http://localhost:8787
```

### 4. Run Tests
```bash
npm run test
```

## Deployment

### Frontend - Vercel

```bash
# Deploy to Vercel
npm run deploy:frontend

# Or use Vercel CLI
vercel
```

**Vercel Environment Variables:**
- `VITE_API_URL`: Backend API URL
- `JWT_SECRET`: JWT signing secret
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth secret
- `GEMINI_API_KEY`: Gemini API key

### Backend - Cloudflare Workers

```bash
# Deploy backend
npm run deploy:backend

# Or use Wrangler directly
cd backend
wrangler deploy
```

**Wrangler Secrets:**
```bash
wrangler secret put JWT_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GEMINI_API_KEY
```

### Database Setup

1. Create D1 database in Cloudflare:
```bash
wrangler d1 create notarium-db
```

2. Initialize schema:
```bash
wrangler d1 execute notarium-db --file schema.sql
```

## Production Checklist

- [ ] All environment variables set
- [ ] Database migrations completed
- [ ] SSL certificate configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Error monitoring setup
- [ ] Backup strategy implemented
- [ ] CDN configured for static assets
- [ ] Security headers configured
- [ ] Tests passing
- [ ] Performance optimized
- [ ] Documentation updated

## Troubleshooting

### Build Fails
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node version: `node --version` (should be 18+)

### API Connection Issues
- Verify API URL in environment variables
- Check CORS headers configuration
- Ensure backend is running/deployed

### Database Issues
- Verify database credentials
- Check schema is initialized
- Review database logs

## Support

For issues or questions, please open an issue on GitHub or contact support.
