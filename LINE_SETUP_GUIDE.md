# 🚀 LINE Integration Setup & Testing Guide

## 📋 Overview

Your Bright Sales app already has complete LINE integration code! This guide will help you set up the LINE Developer account and test all the features.

## 🔧 Step 1: LINE Developer Account Setup

### 1.1 Create LINE Developer Account
1. Go to [LINE Developers Console](https://developers.line.biz/)
2. Login with your LINE account
3. Create a new **Provider** (e.g., "Bright Sales")

### 1.2 Create Messaging API Channel
1. Click **"Create a new channel"** → **"Messaging API"**
2. Fill in the details:
   ```
   App name: Bright Sales CRM
   App description: AI-powered voice-first CRM for sales teams
   Category: Business
   Subcategory: Sales/Marketing
   ```
3. Upload an app icon (512x512 px)
4. Accept the terms and create the channel

### 1.3 Get Channel Credentials
After creating the channel, note these important values:
- **Channel ID**: `1234567890`
- **Channel Secret**: `abcdef1234567890abcdef1234567890`
- **Channel Access Token**: Generate one by clicking "Issue" button

## 🔧 Step 2: Create LIFF App

### 2.1 Add LIFF App
1. In your Messaging API channel, go to **"LIFF"** tab
2. Click **"Add"** to create a new LIFF app
3. Configure:
   ```
   LIFF app name: Bright Sales App
   Size: Full
   Endpoint URL: http://localhost:3999 (for testing)
   Scope: profile, openid, chat_message.write
   Bot link feature: On (Aggressive)
   ```

### 2.2 Note LIFF ID
Copy the generated LIFF ID (format: `1234567890-ABCDEFGH`)

## 🔧 Step 3: Configure Environment Variables

### 3.1 Frontend Environment (.env)
Create/update `.env` file in the root directory:
```bash
# Existing variables
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_BACKEND_URL=http://localhost:4000

# LINE Configuration
REACT_APP_LIFF_ID=1234567890-ABCDEFGH
```

### 3.2 Backend Environment (backend/.env)
Update `backend/.env` file:
```bash
# Existing variables...

# LINE Configuration
LINE_CHANNEL_ACCESS_TOKEN=your-channel-access-token-here
LINE_CHANNEL_SECRET=your-channel-secret-here
FRONTEND_URL=http://localhost:3999
```

## 🧪 Step 4: Testing Plan

### 4.1 Test LIFF Integration (Local Development)

1. **Start the servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev

   # Terminal 2 - Frontend  
   npm run start:devport
   ```

2. **Test in Browser:**
   - Go to `http://localhost:3999/line`
   - Should see LINE integration status
   - Click "Initialize LIFF" to test

3. **Test in LINE App:**
   - Use LIFF URL: `https://liff.line.me/1234567890-ABCDEFGH`
   - Or create QR code pointing to this URL
   - Scan with LINE app to test

### 4.2 Test LINE Bot Commands

1. **Add Bot as Friend:**
   - Go to your channel settings
   - Find the QR code or Bot ID
   - Add the bot as a friend in LINE

2. **Test Commands:**
   Send these messages to your bot:
   - `สถานะ` - Should reply with system status
   - `รายงาน` - Should reply with sales report
   - `ช่วยเหลือ` - Should reply with help menu

### 4.3 Test Notifications

1. **Create Test Group:**
   - Create a LINE group
   - Add your bot to the group
   - Note the group ID from logs

2. **Send Test Notification:**
   ```bash
   curl -X POST http://localhost:4000/api/line/test-notify \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "target": {
         "groupId": "your-group-id"
       }
     }'
   ```

## 🎯 Step 5: Feature Testing Checklist

### ✅ LIFF Features
- [ ] LIFF initialization
- [ ] User profile access
- [ ] Context detection (group/1:1)
- [ ] Share functionality
- [ ] QR code scanning
- [ ] Logout functionality

### ✅ Bot Features  
- [ ] Webhook receives messages
- [ ] Command responses work
- [ ] Welcome messages
- [ ] Error handling

### ✅ Notification Features
- [ ] Activity notifications
- [ ] Deal notifications  
- [ ] Customer notifications
- [ ] System notifications
- [ ] Flex message formatting

## 🔧 Step 6: Production Setup (When Ready)

### 6.1 Deploy to HTTPS Domain
```bash
# Example deployment
https://your-app.com      # Frontend
https://api.your-app.com  # Backend API
```

### 6.2 Update LIFF Configuration
1. Go to LINE Developers Console
2. Update LIFF endpoint URL to your production domain
3. Update webhook URL to your API domain

### 6.3 Configure Webhook
1. In your channel settings
2. Set webhook URL: `https://api.your-app.com/api/line/webhook`
3. Enable webhook

## 🚨 Troubleshooting

### Common Issues:

1. **LIFF not loading:**
   - Check LIFF ID is correct
   - Ensure URL is accessible
   - Check browser console for errors

2. **Bot not responding:**
   - Verify webhook URL is reachable
   - Check channel access token
   - Review server logs

3. **Login not working:**
   - Check LIFF scope configuration
   - Verify LIFF ID in environment
   - Test in actual LINE app (not browser)

### Debug Commands:

```bash
# Test webhook connectivity
curl -X POST http://localhost:4000/api/line/webhook \
  -H "Content-Type: application/json" \
  -d '{"events":[]}'

# Test LINE API connection
curl -H "Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN" \
  https://api.line.me/v2/bot/info

# Check LIFF status
curl https://api.line.me/liff/v1/apps/YOUR_LIFF_ID
```

## 📱 Demo Features Ready to Test

### 1. Voice Recording + LINE Sharing
1. Record a voice note in the app
2. Create an activity from the recording  
3. Share the activity to LINE group
4. Team receives rich notification

### 2. Deal Management + Notifications
1. Create/update a deal in the CRM
2. Automatic notification sent to LINE
3. Rich Flex message with deal details
4. Team can react and comment

### 3. Customer Management + Bot Commands
1. Add new customer to CRM
2. Team receives notification
3. Use bot commands to check status
4. Get daily/weekly reports

## 🎉 Expected Results

Once configured, you'll have:
- **🔐 LINE Login** - Users can login with LINE account
- **📱 Mini App** - Full CRM access through LINE
- **🤖 Smart Bot** - Responds to Thai commands
- **📢 Rich Notifications** - Beautiful Flex messages
- **🔗 Deep Integration** - Share activities, deals, customers
- **📊 Real-time Updates** - Team gets instant notifications

Your LINE integration is **fully coded and ready** - you just need to configure the credentials and test! 🚀