# 🎤 Bright Sales App - MVP Setup Guide

## Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

### 1. Install MongoDB
```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb

# Windows
# Download and install from: https://www.mongodb.com/try/download/community
```

### 2. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd Bright_sale_app

# Make startup script executable
chmod +x start-dev.sh

# Run the development environment
./start-dev.sh
```

### 3. Manual Setup (Alternative)
```bash
# Install dependencies
npm install
cd backend && npm install && cd ..

# Build backend
cd backend && npm run build && cd ..

# Start development servers
npm run dev
```

## Application URLs
- **Frontend**: http://localhost:3999
- **Backend API**: http://localhost:5999/api
- **Health Check**: http://localhost:5999/api/health

## Default Login Credentials
The app automatically creates test users on first run:

### Admin User
- **Username**: admin  
- **Email**: admin@brightsales.com
- **Password**: SecureP@ssw0rd2024!

### Sales User
- **Username**: sales1
- **Email**: sales@brightsales.com  
- **Password**: StrongP@ssw0rd2024!

## Features Available in MVP

### ✅ Authentication & Security
- User registration and login
- JWT token authentication
- Multi-factor authentication (MFA) support
- Password strength validation
- Secure session management

### ✅ Voice Recording & AI
- Real-time voice recording
- Audio transcription (OpenAI integration)
- Voice-to-text conversion
- AI-powered activity creation from voice notes

### ✅ Sales Management
- Customer management (CRUD operations)
- Deal tracking and pipeline management
- Sales activity logging
- Dashboard with analytics
- Reports and insights

### ✅ UI/UX Features
- Mobile-responsive design
- Dark/Light theme support
- Thai language support
- Modern component design
- Error boundaries and handling

## Configuration

### Environment Variables
Update these files as needed:

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:5999/api
```

**Backend (backend/.env)**
```env
MONGODB_URI=mongodb://localhost:27017/bright_sales
JWT_SECRET=your-super-secret-jwt-key-for-development-only
JWT_EXPIRES_IN=30d
PORT=5999
NODE_ENV=development
OPENAI_API_KEY=your-openai-api-key-here
```

### Optional: OpenAI Integration
To enable real AI transcription:
1. Get API key from https://platform.openai.com/api-keys
2. Update `OPENAI_API_KEY` in `backend/.env`
3. Restart the backend server

## Testing the Application

### 1. Backend Health Check
```bash
curl http://localhost:5999/api/health
```

### 2. User Registration
```bash
curl -X POST http://localhost:5999/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123","firstName":"Test","lastName":"User"}'
```

### 3. User Login
```bash
curl -X POST http://localhost:5999/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@brightsales.com","password":"SecureP@ssw0rd2024!"}'
```

## Development Commands

```bash
# Frontend only
npm start

# Backend only
cd backend && npm run dev

# Build production
npm run build
cd backend && npm run build

# Install all dependencies
npm run install:all

# Run both frontend and backend
npm run dev
```

## Troubleshooting

### MongoDB Connection Issues
1. Check if MongoDB is running: `mongosh --eval "db.adminCommand('ping')"`
2. Verify connection string in `backend/.env`
3. Check MongoDB logs for errors

### Port Already in Use
1. Change ports in `package.json` scripts
2. Update `REACT_APP_API_URL` in frontend `.env`
3. Update `PORT` in backend `.env`

### Build Errors
1. Clear node_modules: `rm -rf node_modules backend/node_modules`
2. Reinstall: `npm run install:all`
3. Clear build cache: `rm -rf build backend/dist`

## Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use secure JWT secret
3. Configure MongoDB Atlas or production database
4. Set up proper CORS origins
5. Configure HTTPS

### Build for Production
```bash
# Build frontend
npm run build

# Build backend
cd backend && npm run build

# Start production server
cd backend && npm start
```

## Support
For issues or questions, check the main README.md or create an issue in the repository.