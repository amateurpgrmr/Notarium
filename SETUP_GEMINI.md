# Quick Setup Guide - Gemini AI Integration

## Prerequisites
- Google Cloud Project with Generative AI API enabled
- Gemini API Key (get from https://aistudio.google.com/app/apikey)

## Step-by-Step Setup

### 1. Get Your Gemini API Key
1. Go to https://aistudio.google.com/app/apikey
2. Click "Get API Key"
3. Create a new API key for your project
4. Copy the key

### 2. Add API Key to Backend
```bash
cd Notarium+
npx wrangler secret put GEMINI_API_KEY
# Paste your API key when prompted
```

### 3. Verify Configuration
```bash
# Check wrangler.toml exists
cat wrangler.toml

# Should show:
# name = "notarium-backend"
# main = "src/index.ts"
# [With D1 databases binding and GEMINI_API_KEY reference]
```

### 4. Deploy Backend
```bash
# Local testing
npm run dev

# Production deployment
npm run deploy
```

### 5. Test Features
- **Chat**: Create a chat session and send a message
- **OCR**: Upload a note image, should extract text
- **Study Features**: Generate summaries, quizzes, plans

## Features Now Available

### For Students
✅ AI Chat Tutor - Get instant help with subjects
✅ OCR Note Scanning - Extract text from photos
✅ Smart Summaries - Auto-generate study summaries
✅ Quiz Generator - Create practice questions
✅ Study Plans - Get personalized 7-day plans
✅ Concept Explanations - Understand any topic

### File Changes Made

**Backend** (`backend/src/index.ts`):
- Added Gemini API client initialization
- Added 6 AI feature functions
- Added corresponding API endpoints
- Full error handling

**Frontend** (`src/pages/ChatPage.tsx`):
- Updated message sending to use Gemini AI
- Context-aware responses with user's notes
- Loading states and error handling

**Frontend** (`src/components/UploadNoteModal.tsx`):
- OCR integration with Gemini Vision
- Auto text extraction in scan mode
- Actual API submission (was just logging before)

**Frontend** (`src/components/StudyFeaturesPanel.tsx`) - NEW:
- Summary generation tab
- Quiz generation tab
- Study plan creation tab
- Concept explanation tab

## Environment Variables

### Cloudflare Workers
```bash
# Development
GEMINI_API_KEY=your-api-key-here

# Production (use wrangler secret)
wrangler secret put GEMINI_API_KEY
```

## Testing Checklist

Run through these to verify everything works:

- [ ] **Chat Test**
  1. Go to `/chat`
  2. Create new session
  3. Send a message
  4. Verify AI responds

- [ ] **OCR Test**
  1. Go to Notes
  2. Click "Upload Note"
  3. Select "Scan with AI OCR"
  4. Take/upload a photo with text
  5. Verify text is extracted

- [ ] **Summary Test**
  1. Create or have a note
  2. Open StudyFeaturesPanel
  3. Click Summary tab
  4. Click "Generate Summary"
  5. Verify summary appears

- [ ] **Quiz Test**
  1. Open StudyFeaturesPanel on a note
  2. Click Quiz tab
  3. Click "Generate Quiz"
  4. Verify 5 questions appear

- [ ] **Study Plan Test**
  1. Go to Chat (any session)
  2. Open StudyFeaturesPanel
  3. Click Study Plan tab
  4. Click "Create Study Plan"
  5. Verify 7-day plan is generated

- [ ] **Concept Explanation Test**
  1. Open StudyFeaturesPanel
  2. Click Explain tab
  3. Enter "Photosynthesis"
  4. Click button
  5. Verify explanation appears

## Troubleshooting

### Error: "GEMINI_API_KEY is not configured"
**Solution**: Run `wrangler secret put GEMINI_API_KEY` and add your key

### Error: "Failed to perform OCR"
**Solution**:
- Ensure image is clear and well-lit
- Try a simpler image with clear text
- Check API key is valid

### Chat not responding
**Solution**:
- Check browser console for errors
- Verify API endpoint is accessible
- Ensure user has valid session
- Check API key quota hasn't been exceeded

### Slow responses
**Solution**:
- First request may take 2-5 seconds
- Subsequent requests are faster (cached)
- This is normal for Generative AI APIs

## API Key Security

⚠️ **Important**:
- Never commit API keys to git
- Use `wrangler secret` for production
- Rotate keys regularly
- Monitor API usage in Google Cloud Console

## Performance Tips

1. **Cache summaries** after generation
2. **Rate limit** quiz/plan generation per user
3. **Queue** multiple requests to avoid timeouts
4. **Monitor** API usage in Google Cloud Console

## Next Steps

After setup is complete:

1. **Customize prompts** in backend AI functions for your school's needs
2. **Add caching layer** for frequently generated summaries
3. **Implement analytics** to track feature usage
4. **Train teachers** on how to use the new AI features
5. **Gather student feedback** on AI tutor effectiveness

## Support

- Check `/GEMINI_INTEGRATION.md` for detailed API documentation
- Review error messages in browser console and backend logs
- Test API endpoints with cURL or Postman
- Check Google AI Studio for API status

## Rate Limits

Google Generative AI has limits:
- ~60 requests/minute per API key
- Monitor usage in Google Cloud Console
- Implement request batching for large classes

---

**Setup Complete!** 🎉 Your Notarium+ now has full AI-powered study features.
