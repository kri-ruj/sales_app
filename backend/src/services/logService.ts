import mongoose, { Schema, Document } from 'mongoose';

interface ISystemLog extends Document {
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  userId?: mongoose.Types.ObjectId;
  action: string;
  metadata?: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

const SystemLogSchema: Schema = new Schema({
  level: {
    type: String,
    enum: ['info', 'warning', 'error', 'debug'],
    required: true,
    default: 'info'
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: true,
    maxlength: 100
  },
  metadata: {
    type: Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    maxlength: 45 // IPv6 addresses can be up to 45 characters
  },
  userAgent: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Create indexes for better performance
SystemLogSchema.index({ timestamp: -1 });
SystemLogSchema.index({ level: 1, timestamp: -1 });
SystemLogSchema.index({ action: 1, timestamp: -1 });
SystemLogSchema.index({ userId: 1, timestamp: -1 });

const SystemLog = mongoose.model<ISystemLog>('SystemLog', SystemLogSchema);

export class LogService {
  
  static async log(
    level: 'info' | 'warning' | 'error' | 'debug',
    action: string,
    message: string,
    metadata?: any,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const logEntry = new SystemLog({
        level,
        action,
        message,
        metadata,
        userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        ipAddress,
        userAgent,
        timestamp: new Date()
      });
      
      await logEntry.save();
      
      // Also log to console for development
      const logMessage = `[${level.toUpperCase()}] ${action}: ${message}`;
      switch (level) {
        case 'error':
          console.error(logMessage, metadata);
          break;
        case 'warning':
          console.warn(logMessage, metadata);
          break;
        case 'debug':
          console.debug(logMessage, metadata);
          break;
        default:
          console.log(logMessage, metadata);
      }
      
    } catch (error) {
      console.error('Failed to write log entry:', error);
    }
  }

  static async info(action: string, message: string, metadata?: any, userId?: string): Promise<void> {
    return this.log('info', action, message, metadata, userId);
  }

  static async warning(action: string, message: string, metadata?: any, userId?: string): Promise<void> {
    return this.log('warning', action, message, metadata, userId);
  }

  static async error(action: string, message: string, metadata?: any, userId?: string): Promise<void> {
    return this.log('error', action, message, metadata, userId);
  }

  static async debug(action: string, message: string, metadata?: any, userId?: string): Promise<void> {
    return this.log('debug', action, message, metadata, userId);
  }

  static async getRecentLogs(
    limit: number = 100,
    level?: string,
    action?: string,
    userId?: string
  ): Promise<ISystemLog[]> {
    try {
      const filter: any = {};
      if (level) filter.level = level;
      if (action) filter.action = { $regex: action, $options: 'i' };
      if (userId) filter.userId = new mongoose.Types.ObjectId(userId);

      const logs = await SystemLog
        .find(filter)
        .populate('userId', 'firstName lastName username')
        .sort({ timestamp: -1 })
        .limit(limit);

      return logs;
    } catch (error) {
      console.error('Failed to get recent logs:', error);
      return [];
    }
  }

  static async getLogStats(days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await SystemLog.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$level',
            count: { $sum: 1 }
          }
        }
      ]);

      const actionStats = await SystemLog.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 10
        }
      ]);

      return {
        levelStats: stats,
        actionStats: actionStats,
        totalLogs: await SystemLog.countDocuments({
          timestamp: { $gte: startDate }
        })
      };
    } catch (error) {
      console.error('Failed to get log stats:', error);
      return { levelStats: [], actionStats: [], totalLogs: 0 };
    }
  }
}

export default LogService;