// Frontend logging utility
interface LogEvent {
  level: 'info' | 'warning' | 'error' | 'debug';
  action: string;
  message: string;
  metadata?: any;
  timestamp: string;
  url: string;
  userAgent: string;
}

class FrontendLogger {
  private static logs: LogEvent[] = [];
  private static maxLogs = 100; // Keep last 100 logs in memory

  static log(level: 'info' | 'warning' | 'error' | 'debug', action: string, message: string, metadata?: any) {
    const logEvent: LogEvent = {
      level,
      action,
      message,
      metadata,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Add to in-memory logs
    this.logs.unshift(logEvent);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console log with appropriate level
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

    // For critical errors, could send to backend
    if (level === 'error') {
      this.sendToBackend(logEvent);
    }
  }

  static info(action: string, message: string, metadata?: any) {
    this.log('info', action, message, metadata);
  }

  static warning(action: string, message: string, metadata?: any) {
    this.log('warning', action, message, metadata);
  }

  static error(action: string, message: string, metadata?: any) {
    this.log('error', action, message, metadata);
  }

  static debug(action: string, message: string, metadata?: any) {
    this.log('debug', action, message, metadata);
  }

  // Get recent logs for debugging
  static getRecentLogs(limit: number = 20): LogEvent[] {
    return this.logs.slice(0, limit);
  }

  // Send critical events to backend (could be enhanced to batch send)
  private static async sendToBackend(logEvent: LogEvent) {
    try {
      // Only send critical frontend errors to backend
      // This could be enhanced to use a dedicated endpoint
      console.log('Critical frontend error - would send to backend:', logEvent);
    } catch (error) {
      console.error('Failed to send log to backend:', error);
    }
  }

  // Performance logging
  static performance(action: string, startTime: number, metadata?: any) {
    const duration = performance.now() - startTime;
    this.info('PERFORMANCE', `${action} completed in ${duration.toFixed(2)}ms`, {
      ...metadata,
      duration
    });
  }

  // User interaction logging
  static userAction(action: string, element?: string, metadata?: any) {
    this.info('USER_ACTION', `User ${action}${element ? ` on ${element}` : ''}`, metadata);
  }

  // API call logging
  static apiCall(method: string, url: string, status: number, duration: number, metadata?: any) {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warning' : 'info';
    this.log(level, 'API_CALL', `${method} ${url} - ${status} (${duration}ms)`, {
      ...metadata,
      method,
      url,
      status,
      duration
    });
  }
}

export default FrontendLogger;