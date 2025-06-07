# LINE Mini App Deployment Guide

This guide explains how to deploy Bright Sales as a LINE Mini App with notification capabilities.

## 🚀 Overview

The Bright Sales app integrates with LINE ecosystem through:
1. **LINE Mini App (LIFF)** - Frontend app running inside LINE
2. **LINE Bot** - Backend service for notifications and chat commands
3. **Flex Messages** - Rich notifications to LINE groups/chats

## 📋 Prerequisites

### 1. LINE Developer Account
- Create account at [LINE Developers](https://developers.line.biz/)
- Access to LINE Messaging API and LIFF

### 2. Domain and SSL Certificate
- Public domain with HTTPS (required for LIFF)
- SSL certificate properly configured

### 3. Server Resources
- Node.js 18+ server
- MongoDB database
- Public webhook endpoint

## 🔧 Setup Process

### Step 1: Create LINE Channel

1. **Login to LINE Developers Console**
   - Go to [LINE Developers](https://developers.line.biz/)
   - Login with your LINE account

2. **Create New Provider**
   - Click "Create" → "Provider"
   - Enter provider name (e.g., "Bright Sales")

3. **Create Messaging API Channel**
   - Click "Create a new channel" → "Messaging API"
   - Fill in channel information:
     - App name: "Bright Sales CRM"
     - App description: "AI-powered voice-first CRM"
     - Category: "Business"
     - Subcategory: "Sales/Marketing"
   - Upload app icon (512x512 px)

4. **Get Channel Credentials**
   - Note down:
     - Channel ID
     - Channel Secret
     - Channel Access Token

### Step 2: Create LIFF App

1. **In your Messaging API Channel**
   - Go to "LIFF" tab
   - Click "Add" to create new LIFF app

2. **LIFF Configuration**
   ```json
   {
     "liffId": "generated-by-line",
     "view": {
       "type": "full",
       "url": "https://your-domain.com"
     },
     "features": {
       "ble": false,
       "qrCodeReader": true,
       "shareTargetPicker": true
     },
     "scope": ["profile", "openid", "chat_message.write"],
     "botPrompt": "normal"
   }
   ```

3. **Note LIFF ID**
   - Copy the generated LIFF ID (format: `1234567890-ABCDEFGH`)

### Step 3: Configure Environment Variables

#### Frontend (.env)
```bash
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_BACKEND_URL=https://your-api-domain.com
REACT_APP_BASE_URL=https://your-app-domain.com
REACT_APP_LIFF_ID=1234567890-ABCDEFGH
```

#### Backend (.env)
```bash
# Server
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://your-app-domain.com

# Database
MONGODB_URI=mongodb://localhost:27017/bright_sales

# LINE Configuration
LINE_CHANNEL_ACCESS_TOKEN=your-channel-access-token
LINE_CHANNEL_SECRET=your-channel-secret

# Security
JWT_SECRET=your-super-secret-jwt-key
```

### Step 4: Deploy Backend

1. **Deploy to Server**
   ```bash
   # Upload backend code to server
   npm install
   npm run build
   pm2 start dist/server.js --name bright-sales-api
   ```

2. **Configure Webhook**
   - In LINE Developers Console
   - Go to Messaging API → Webhook settings
   - Set webhook URL: `https://your-api-domain.com/api/line/webhook`
   - Enable "Use webhook"

3. **Test Webhook**
   ```bash
   curl -X POST https://your-api-domain.com/api/line/webhook \
     -H "Content-Type: application/json" \
     -H "X-Line-Signature: test" \
     -d '{"events":[]}'
   ```

### Step 5: Deploy Frontend

1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Upload to Web Server**
   ```bash
   # Upload build folder to your web server
   # Ensure HTTPS is configured
   # Set up proper redirects for SPA
   ```

3. **Nginx Configuration Example**
   ```nginx
   server {
       listen 443 ssl;
       server_name your-app-domain.com;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       root /path/to/build;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:4000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Step 6: Configure Bot Features

1. **Enable Bot Features**
   - Auto-reply messages: Disabled
   - Greeting messages: Enabled
   - Webhook: Enabled

2. **Add Bot to Group**
   - Create test LINE group
   - Add your bot to the group
   - Note the Group ID for notifications

3. **Test Bot Commands**
   - Send "สถานะ" for status
   - Send "รายงาน" for reports
   - Send "ช่วยเหลือ" for help

## 📱 LINE Mini App Features

### 1. LIFF Integration
- **Profile Access**: Get LINE user profile
- **Context Awareness**: Detect if in group/1:1 chat
- **Share Functions**: Share activities and deals
- **QR Code Scanner**: Built-in QR scanning

### 2. Authentication Flow
```typescript
// Check if in LINE environment
if (liffService.isInClient()) {
  // Running in LINE app
  if (liffService.isLoggedIn()) {
    // User is logged in
    const profile = await liffService.getProfile();
  } else {
    // Redirect to LINE login
    await liffService.login();
  }
} else {
  // Running in browser - use web login
}
```

### 3. Sharing Activities
```typescript
const message = liffService.createActivityShareMessage(activity);
await liffService.shareTargetPicker([message]);
```

## 🔔 Notification System

### 1. Automatic Notifications
The system automatically sends notifications for:
- New activities created
- Deal status changes
- Customer updates
- System alerts

### 2. Flex Message Format
```json
{
  "type": "flex",
  "altText": "📝 New Activity",
  "contents": {
    "type": "bubble",
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "📝 New Activity",
          "weight": "bold",
          "size": "lg",
          "color": "#3B82F6"
        }
      ]
    }
  }
}
```

### 3. Configure Notification Targets
```typescript
// In backend/src/utils/notificationHelper.ts
const DEFAULT_TARGETS = [
  { groupId: 'C1234567890abcdef1234567890abcdef1' }, // Sales team group
  { userId: 'U1234567890abcdef1234567890abcdef1' },   // Manager
];
```

## 🧪 Testing

### 1. LIFF Testing
```bash
# Test LIFF URL directly
https://liff.line.me/1234567890-ABCDEFGH

# Test in LINE app
line://app/1234567890-ABCDEFGH
```

### 2. Webhook Testing
```bash
# Test notification endpoint
curl -X POST https://your-api-domain.com/api/line/test-notify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "target": {
      "groupId": "your-group-id"
    }
  }'
```

### 3. Bot Commands
Test these commands in your LINE group:
- `สถานะ` - System status
- `รายงาน` - Sales report
- `ช่วยเหลือ` - Help menu

## 🚀 Production Checklist

### Security
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Webhook signature verification enabled
- [ ] Environment variables secured
- [ ] Rate limiting configured
- [ ] CORS properly configured

### Performance
- [ ] CDN configured for static assets
- [ ] Database indexes optimized
- [ ] Caching strategy implemented
- [ ] Monitoring and logging setup

### LINE Configuration
- [ ] LIFF app tested in LINE client
- [ ] Bot responses working correctly
- [ ] Notification targets configured
- [ ] Rich menu setup (optional)
- [ ] Official account verification (for production)

### Monitoring
- [ ] Webhook health monitoring
- [ ] Error tracking (Sentry/similar)
- [ ] Performance monitoring
- [ ] Database monitoring
- [ ] LINE API quota monitoring

## 🔧 Troubleshooting

### Common Issues

1. **LIFF not loading**
   - Check HTTPS certificate
   - Verify LIFF URL configuration
   - Check CORS settings

2. **Webhook not receiving events**
   - Verify webhook URL is publicly accessible
   - Check LINE signature verification
   - Review server logs

3. **Notifications not sending**
   - Verify Channel Access Token
   - Check target IDs are correct
   - Review rate limits

4. **Login issues**
   - Check LIFF ID configuration
   - Verify scopes are correct
   - Check redirect URLs

### Debug Commands

```bash
# Check webhook connectivity
curl -I https://your-api-domain.com/api/line/webhook

# Test LINE API connection
curl -H "Authorization: Bearer your-channel-access-token" \
  https://api.line.me/v2/bot/info

# Check LIFF configuration
curl https://api.line.me/liff/v1/apps/1234567890-ABCDEFGH
```

## 📞 Support

For LINE-specific issues:
- [LINE Developers Documentation](https://developers.line.biz/en/docs/)
- [LIFF Documentation](https://developers.line.biz/en/docs/liff/)
- [Messaging API Documentation](https://developers.line.biz/en/docs/messaging-api/)

For app-specific issues:
- Check server logs
- Review browser console
- Test API endpoints directly