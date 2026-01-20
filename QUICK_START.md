# 🚀 Quick Start Guide - Notarium+ with Gemini AI

## Prerequisites
- ✅ API Key: `YOUR_GEMINI_API_KEY_HERE` (configured)
- ✅ Backend: Running on `http://localhost:8787`
- Node.js and npm installed

---

## 🟢 Backend Status: RUNNING ✅

The backend is already running with mock database. Skip to **Frontend Setup** below.

---

## 📱 Frontend Setup (Next Step)

### Open New Terminal Window

```bash
cd /Users/richardamadeus/Downloads/test/Notarium+
npm install  # Install dependencies (if not done yet)
npm run dev:frontend
```

This will start the frontend on **http://localhost:5173**

---

## 🧪 Testing Features

### 1. **AI Chat Tutor** 💬

1. Open http://localhost:5173
2. **Sign up or login** (use any credentials, it's a dev environment)
3. Click **"Chat"** in navigation
4. Click **"+ New Chat"**
5. Fill in:
   - **Subject**: Mathematics
   - **Topic**: Derivatives
6. Click **"Create"**
7. Type a question: `What is the derivative of x^3?`
8. Press **Enter** or click **Send**

**Expected**: AI responds with detailed explanation ✨

---

### 2. **OCR Note Upload** 📸

1. Click **"Notes"** in navigation
2. Click **"Upload Note"** button
3. Select mode: **"Scan with AI OCR"** (should be default)
4. Click **"Take Photo"** or **"Upload File"**
   - Take a photo of text/notes with your camera OR
   - Upload an image file with text on it
5. Wait for AI to extract text automatically ⏳
6. Fill in:
   - **Title**: (your note title)
   - **Subject**: (select from dropdown)
   - **Your Class**: (select from dropdown)
7. Click **"Upload Note"** ✅

**Expected**: Text extracted from image appears in preview

---

### 3. **Study Features** 📚

Once you have notes in the system:

1. Go to **Notes** section
2. Find a note
3. Look for **"Study Tools"** panel (or integrate StudyFeaturesPanel if not visible)
4. Choose one of:
   - **📝 Summary** - Generate a brief summary
   - **❓ Quiz** - Create 5 practice questions
   - **📅 Study Plan** - Get 7-day study schedule
   - **💡 Explain** - Explain any concept

5. Click the respective button and wait for results ✨

---

## 🔧 Environment Details

| Component | Details |
|-----------|---------|
| **Backend** | http://localhost:8787 |
| **Frontend** | http://localhost:5173 |
| **Database** | Mock (in-memory) - Development only |
| **AI Engine** | Gemini 2.0 Flash |
| **API Key** | Configured in `backend/.env.local` |

---

## 📊 What Gets Tested

✅ **Backend API**: All endpoints working
✅ **Gemini Integration**: Chat, OCR, Summary, Analysis
✅ **Frontend UI**: Pages, Components, Forms
✅ **User Authentication**: Login/signup flow
✅ **Note Management**: Create, upload, view notes
✅ **AI Features**: Tutor responses, text extraction

---

## ⚡ Quick Commands

### Kill All Servers
```bash
pkill -f "node dev-server.js"
pkill -f "vite"
```

### Restart Backend Only
```bash
cd backend
npm run dev
```

### Restart Frontend Only
```bash
npm run dev:frontend
```

### Restart Both
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2 (new terminal)
cd /Users/richardamadeus/Downloads/test/Notarium+ && npm run dev:frontend
```

---

## 🐛 Troubleshooting

### "Cannot connect to backend"
- Check if backend is running: `curl http://localhost:8787`
- If not, run: `cd backend && npm run dev`

### "Image not uploading"
- Ensure image has clear, readable text
- Try a different image format (JPG, PNG)
- Check browser console for errors

### "AI not responding"
- Check internet connection
- Verify API key is valid
- Check browser console for error messages

### "Port 8787 already in use"
```bash
pkill -f "node dev-server.js"
sleep 2
cd backend && npm run dev
```

---

## 📝 Features Overview

| Feature | Status | Notes |
|---------|--------|-------|
| Chat with AI | ✅ Ready | Full conversation with context |
| OCR Scanning | ✅ Ready | Extract text from images |
| Summarization | ✅ Ready | Auto-generate summaries |
| Quiz Generator | ✅ Ready | Create practice questions |
| Study Plans | ✅ Ready | 7-day personalized plans |
| Concept Explain | ✅ Ready | Explain any topic |

---

## 🎓 Sample Conversations to Try

### Math
> "Explain the quadratic formula and show me an example"

### Biology
> "What is photosynthesis? Break it down step by step"

### History
> "What were the main causes of World War I?"

### Chemistry
> "How do atomic bonds work?"

---

## 📸 Sample Images to Test OCR

Try uploading:
- ✅ Photo of textbook page
- ✅ Photo of handwritten notes
- ✅ Screenshot of equations
- ✅ Photo of study materials
- ✅ PDF page converted to image

---

## 🔑 API Key Security

⚠️ **Current Key** (Development):
```
YOUR_GEMINI_API_KEY_HERE
```

**For Production**:
1. Go to https://aistudio.google.com/app/apikey
2. Delete the current key
3. Create a new key
4. Store securely with: `wrangler secret put GEMINI_API_KEY`

---

## 📊 Monitor API Usage

Visit: https://console.cloud.google.com/

Track:
- API calls made
- Response times
- Error rates
- Cost estimation

---

## 🚀 Next: Deploy to Production

When ready to go live:

```bash
# Deploy backend to Cloudflare
npm run deploy:backend

# Deploy frontend to Vercel (or your hosting)
npm run deploy:frontend
```

---

## ✅ Verification Checklist

Before considering testing complete:

- [ ] Backend running on http://localhost:8787
- [ ] Frontend running on http://localhost:5173
- [ ] Can create account / login
- [ ] Chat session creates successfully
- [ ] AI tutor responds to questions
- [ ] OCR extracts text from image
- [ ] Can create notes
- [ ] Study features generate content
- [ ] No console errors
- [ ] All pages load correctly

---

## 📞 Support

If you encounter issues:

1. **Check logs**: Browser console (F12) and terminal output
2. **Read docs**: See GEMINI_INTEGRATION.md for detailed API info
3. **Check tests**: See TEST_RESULTS.md for verification
4. **Review setup**: See SETUP_GEMINI.md for configuration

---

## 🎉 You're Ready!

```bash
cd /Users/richardamadeus/Downloads/test/Notarium+
npm run dev:frontend
```

Open http://localhost:5173 and start testing! 🚀

---

**Last Updated**: November 3, 2025
**Status**: Ready for Testing ✅
