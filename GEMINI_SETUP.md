# 🚀 Gemini AI Voice Enhancement Setup

This guide will help you set up Google's Gemini AI for enhanced voice transcription in your Bright Sales CRM.

## 🎯 What You'll Get

With Gemini AI integration, your voice recordings will be enhanced with:

- **🎤 Accurate Thai Speech-to-Text** using Google Cloud Speech API
- **🧠 AI-Powered Analysis** with Gemini Pro model
- **👤 Customer Information Extraction** (names, companies)
- **💰 Deal Information Detection** (values, status)
- **✅ Action Items Generation** (automatic follow-up tasks)
- **📋 Conversation Summaries** (key points and insights)

## 🔑 Getting Your Gemini API Key

### Step 1: Get Google AI Studio API Key (Recommended - Free)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Add it to your `.env` file in the backend:

```bash
# Google AI Gemini API Key (Recommended - for enhanced transcription)
GEMINI_API_KEY=your-actual-api-key-here
```

### Step 2: Alternative - Google Cloud Speech-to-Text (Optional)

For production use, you can also set up Google Cloud Speech-to-Text:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Speech-to-Text API
4. Create a service account and download the JSON key file
5. Set the environment variable:

```bash
# Google Cloud Speech-to-Text (Optional)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
```

## 🔧 Configuration

Your backend `.env` file should look like this:

```bash
# AI Transcription Services
# OpenAI API Key (Optional - for Whisper transcription)
OPENAI_API_KEY=your-openai-api-key-here

# Google AI Gemini API Key (Recommended - for enhanced transcription)
GEMINI_API_KEY=your-gemini-api-key-here

# Google Cloud Speech-to-Text (Optional - for Google Cloud credentials)
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
```

## 🚀 How It Works

### Priority Order

The system will automatically choose the best available service:

1. **🥇 Gemini Enhanced** (Google Speech-to-Text + Gemini AI analysis)
2. **🥈 Google Speech-to-Text** (Basic transcription)
3. **🥉 OpenAI Whisper** (Alternative AI transcription)
4. **🎭 Mock Mode** (Demo/testing without API keys)

### Enhanced Features

When Gemini is active, you'll see:

- **🧠 AI Analysis & Insights** section
- **👤 Customer Information** automatically extracted
- **💰 Deal Details** detected from conversation
- **📋 Conversation Summary** generated
- **✅ Action Items** list for follow-up
- **🚀 "Gemini AI Enhanced"** indicator

## 🛠️ Testing

1. Start your backend: `cd backend && npm run dev`
2. Start your frontend: `npm start`
3. Navigate to the home page (Voice Recording)
4. Record a voice note mentioning customer names, companies, or deals
5. Watch for the enhanced AI analysis section!

## 💡 Tips

- **Thai Language**: Gemini works excellently with Thai conversations
- **Business Context**: It understands sales terminology and business contexts
- **Multiple Languages**: Supports Thai-English mixed conversations
- **Free Tier**: Google AI Studio provides generous free usage
- **Fallback**: Always falls back to mock mode if APIs are unavailable

## 🆘 Troubleshooting

### No Enhanced Features Showing?

1. Check your `GEMINI_API_KEY` in the backend `.env` file
2. Restart the backend server after adding the key
3. Check the browser console for any API errors
4. Verify the API key is valid at [Google AI Studio](https://makersuite.google.com/)

### Error Messages?

- **"Gemini not configured"**: Add your API key to `.env`
- **"Failed to parse"**: The AI response format changed, using fallback
- **"API quota exceeded"**: You've hit the free tier limit

---

🎉 **Ready to experience AI-powered voice transcription!**