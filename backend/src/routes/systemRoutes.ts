import { Router, Request, Response } from 'express';
import LogService from '../services/logService';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// System health check with logging
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        total: process.memoryUsage().heapTotal / 1024 / 1024,
        external: process.memoryUsage().external / 1024 / 1024
      }
    };

    // Log health check access (info level, no spam)
    if (Math.random() < 0.1) { // Only log 10% of health checks to avoid spam
      await LogService.info(
        'SYSTEM_HEALTH_CHECK',
        'System health check accessed',
        {
          ...healthData,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
    }

    res.json({
      success: true,
      data: healthData
    });
  } catch (error) {
    // Log health check error
    await LogService.error(
      'SYSTEM_HEALTH_ERROR',
      `System health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        errorStack: error instanceof Error ? error.stack : null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get system logs (admin only)
router.get('/logs', protect, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      limit = 100, 
      level, 
      action, 
      userId 
    } = req.query;

    const logs = await LogService.getRecentLogs(
      Number(limit),
      level as string,
      action as string,
      userId as string
    );

    await LogService.info(
      'SYSTEM_LOGS_ACCESSED',
      `Admin accessed system logs`,
      {
        requestedLimit: Number(limit),
        filters: { level, action, userId },
        logsReturned: logs.length,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      (req as any).user?.id
    );

    res.json({
      success: true,
      data: logs,
      total: logs.length
    });
  } catch (error) {
    await LogService.error(
      'SYSTEM_LOGS_ERROR',
      `Failed to retrieve system logs: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        errorStack: error instanceof Error ? error.stack : null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      (req as any).user?.id
    );

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve logs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get system log statistics (admin only)
router.get('/logs/stats', protect, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = 30 } = req.query;

    const stats = await LogService.getLogStats(Number(days));

    await LogService.info(
      'SYSTEM_LOG_STATS_ACCESSED',
      `Admin accessed log statistics`,
      {
        requestedDays: Number(days),
        totalLogs: stats.totalLogs,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      (req as any).user?.id
    );

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        ...stats
      }
    });
  } catch (error) {
    await LogService.error(
      'SYSTEM_LOG_STATS_ERROR',
      `Failed to retrieve log statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        errorStack: error instanceof Error ? error.stack : null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      (req as any).user?.id
    );

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve log statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create test log entry (admin only, for testing)
router.post('/logs/test', protect, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { level = 'info', message = 'Test log entry' } = req.body;

    await LogService.log(
      level,
      'SYSTEM_LOG_TEST',
      message,
      {
        testEntry: true,
        requestedBy: (req as any).user?.id
      },
      (req as any).user?.id,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'Test log entry created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create test log entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;