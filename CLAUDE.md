# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Bright Sales App** - a Thai-language voice-first CRM application with AI transcription features. The system consists of a React TypeScript frontend and Node.js/Express backend with MongoDB, specifically designed for Thai sales teams to manage customers, deals, and activities through voice recording.

## Architecture

### Frontend (React + TypeScript)
- **Location**: Root directory (`/src`)
- **Tech Stack**: React 18, TypeScript, Tailwind CSS, React Router
- **State Management**: React Context API (`src/context/AuthContext.tsx`)
- **API Layer**: Centralized in `src/services/` (apiService.ts, authService.ts)
- **Voice Features**: Custom hook `src/hooks/useVoiceRecording.ts` with Web Audio API
- **Key Components**: Dashboard, CustomerList, VoiceAssistant, deals management

### Backend (Node.js + Express + MongoDB)
- **Location**: `backend/` directory
- **Tech Stack**: Express.js, TypeScript, MongoDB with Mongoose, JWT authentication
- **Database Models**: User, Customer, Deal, SalesActivity (`backend/src/models/`)
- **API Routes**: RESTful endpoints in `backend/src/routes/`
- **Authentication**: JWT with MFA support using Speakeasy
- **File Handling**: Multer library for audio uploads, stored in `backend/uploads/`

### Authentication System
- **JWT-based** with 30-day expiration
- **Multi-Factor Authentication** with TOTP and backup codes
- **LINE Login integration** for social authentication
- **Mock user**: `test@test.com` / `test123` (ID: `654321654321654321654321`)
- **Role-based access**: admin, manager, sales, user

### Database Schema
- **Users**: Authentication, MFA settings, roles
- **Customers**: Thai company data with mock examples (บริษัท ABC จำกัด, XYZ Corporation)
- **SalesActivities**: Voice recordings, transcriptions, Thai language content
- **Deals**: Pipeline management with status tracking

## Development Commands

### Full Stack Development
```bash
# Install all dependencies (frontend + backend)
npm run install:all

# Run both frontend and backend concurrently
npm run dev  # Frontend on :3999, Backend on :4000

# Frontend only
npm start    # Runs on :3000
npm run start:devport  # Runs on :3999

# Backend only
cd backend && npm run dev  # Development with nodemon
cd backend && npm start    # Production mode
```

### Backend Specific
```bash
cd backend
npm run build    # Compile TypeScript to dist/
npm run dev      # Development with hot reload
npm start        # Run compiled version
```

### Testing & Building
```bash
npm test         # Frontend tests
npm run build    # Production build
npm run backend:build  # Backend compilation
```

## Environment Configuration

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_BACKEND_URL=http://localhost:4000
```

### Backend (backend/.env)
- **MongoDB**: `mongodb://localhost:27017/bright_sales`
- **Server Port**: 4000 (configurable)
- **JWT Secret**: Required for authentication
- **OpenAI Key**: Optional for real AI transcription
- **CORS Origins**: Multiple localhost ports supported

## Key Implementation Details

### Voice Recording Flow
1. **Frontend**: `useVoiceRecording` hook manages Web Audio API
2. **Upload**: Audio sent to `/api/audio/upload` endpoint
3. **Processing**: Backend processes with mock/real AI transcription
4. **Storage**: Files in `backend/uploads/`, metadata in database

### Authentication Flow
1. **Login**: POST `/api/auth/login` returns JWT token
2. **Token Storage**: localStorage with user data
3. **API Calls**: All protected routes require `Authorization: Bearer <token>`
4. **Mock User Handling**: Special case in auth middleware for test user

### API Response Format
All backend endpoints follow consistent format:
```typescript
{
  success: boolean;
  data: T;
  message?: string;
}
```

### Thai Language Support
- **Sample Data**: Activities and customers use Thai text
- **Database**: Configured for UTF-8 Thai characters
- **Frontend**: Thai language in UI and data display

## Database Seeding

Backend automatically seeds sample data in development:
- **Admin User**: admin@brightsales.com
- **Sales User**: sales@brightsales.com (Thai name: สมชาย ขายดี)
- **Sample Activities**: Thai language activities with real scenarios
- **Mock Customers**: Thai companies for testing

## File Upload System

- **Endpoint**: `/api/audio/upload`
- **Storage**: Local filesystem in `backend/uploads/`
- **Format**: Supports WebM, WAV, MP3 audio files
- **Size Limit**: 50MB
- **Access**: Static file serving at `/uploads/`

## Testing Endpoints

The backend is currently running on port 4000. Test with:
```bash
# Health check
curl http://localhost:4000/api/health

# Login test
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# API test (requires token from login)
curl -H "Authorization: Bearer <token>" http://localhost:4000/api/customers
```

## Common Issues & Solutions

### Port Conflicts
- Frontend: 3000 (default) or 3999 (dev mode)
- Backend: 4000 (current), configurable via PORT env var
- CORS configured for multiple localhost ports

### Authentication Issues
- Mock user `654321654321654321654321` handled specially in middleware
- Real users require MongoDB lookup
- MFA optional, falls back to regular login

### Voice Recording Requirements
- Requires HTTPS or localhost for microphone access
- Browser compatibility: Chrome, Firefox, Safari, Edge
- Fallback mock transcription when OpenAI unavailable

## Development Focus Areas

When working on this codebase:
1. **Voice Features**: Core differentiator, ensure Web Audio API integration works
2. **Thai Language**: Maintain UTF-8 support and Thai sample data
3. **Authentication**: Handle both mock and real users properly
4. **API Consistency**: Follow established response format patterns
5. **Error Handling**: Comprehensive error messages in both languages

## Planned Features and Enhancements

### Voice and Recording Features
1. **Store Voice Record**
   - Implement comprehensive audio storage system for sales activities
   - Support multiple audio formats (WebM, WAV, MP3)
   - Integrate with backend file upload mechanism

2. **Real-Time ASR (Automatic Speech Recognition)**
   - Develop real-time text transcription during voice recording
   - Display live transcription to user for immediate feedback
   - Support Thai language transcription
   - Fallback to mock transcription if AI service unavailable

3. **Sales Activities Categorization**
   - Create dynamic categorization system for sales activities
   - Support multiple classification types
   - Visualize activities based on categories
   - Flexible tagging and filtering mechanism

4. **Performance Scoring System**
   - Build scoring algorithm based on activities log
   - Track and calculate performance metrics
   - Generate performance reports and insights
   - Customizable scoring criteria

5. **AI-Assisted Data Classification**
   - Implement AI agent for intelligent text classification
   - Suggest data log field categorizations
   - Provide human confirmation/editing interface
   - Continuously learn and improve classification accuracy