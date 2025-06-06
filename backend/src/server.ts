import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs-extra';

// Import routes
import audioRoutes from './routes/audioRoutes';
import activityRoutes from './routes/activityRoutes';
import dealRoutes from './routes/dealRoutes';
import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import systemRoutes from './routes/systemRoutes';
import aiRoutes from './routes/aiRoutes';
import lineRoutes from './routes/lineRoutes';
import taskRoutes from './routes/taskRoutes';
import boardRoutes from './routes/boardRoutes';

// Import database connection
import DatabaseConnection from './config/database';
import LogService from './services/logService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// Middleware
app.use(cors({
  origin: ['http://localhost:3999', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:4000'], // Frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
fs.ensureDirSync(uploadsDir);

// Serve static files (audio files)
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/audio', audioRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/line', lineRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/boards', boardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Bright Sales Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(async (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Log the error
  await LogService.error(
    'SERVER_ERROR',
    `Server error occurred: ${err.message}`,
    {
      errorStack: err.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  );
  
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Connect to MongoDB
    await DatabaseConnection.connect();
    
    // Seed initial data in development
    if (process.env.NODE_ENV === 'development') {
      await DatabaseConnection.seedInitialData();
    }

    // Start the server
    const server = app.listen(PORT, async () => {
      console.log(`🚀 Bright Sales Backend running on port ${PORT}`);
      console.log(`📁 Uploads directory: ${uploadsDir}`);
      console.log(`🌐 CORS enabled for: http://localhost:3999, http://localhost:3000, http://localhost:3001`);
      console.log(`📊 Database status: ${DatabaseConnection.getConnectionStatus() ? 'Connected' : 'Disconnected'}`);
      console.log(`🔗 Backend URL: http://localhost:${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔗 Test login: curl -X POST http://localhost:${PORT}/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test123"}'`);
      
      // Log server startup
      await LogService.info(
        'SERVER_STARTED',
        `Bright Sales Backend started successfully on port ${PORT}`,
        {
          port: PORT,
          environment: process.env.NODE_ENV || 'development',
          nodeVersion: process.version,
          uploadsDirectory: uploadsDir,
          databaseConnected: DatabaseConnection.getConnectionStatus()
        }
      );
    });

    server.on('error', async (err: any) => {
      console.error('❌ Server error:', err);
      
      // Log server error
      await LogService.error(
        'SERVER_STARTUP_ERROR',
        `Server startup error: ${err.message}`,
        {
          errorCode: err.code,
          errorStack: err.stack,
          port: PORT
        }
      );
      
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
        server.listen(PORT + 1);
      }
    });

    server.on('listening', () => {
      const address = server.address();
      const actualPort = typeof address === 'string' ? address : address?.port;
      console.log(`✅ Server is listening on port ${actualPort}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();

export default app; 