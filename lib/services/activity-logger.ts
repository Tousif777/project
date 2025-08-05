export type LogLevel = 'info' | 'warning' | 'error' | 'success';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  operation?: string;
}

export class ActivityLogger {
  private static logs: LogEntry[] = [];
  private static maxLogs = 1000;

  static log(level: LogLevel, message: string, context?: Record<string, any>, operation?: string): void {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      operation
    };

    this.logs.unshift(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Also log to console for debugging
    const consoleMessage = `[${entry.timestamp}] ${level.toUpperCase()}: ${message}`;
    switch (level) {
      case 'error':
        console.error(consoleMessage, context);
        break;
      case 'warning':
        console.warn(consoleMessage, context);
        break;
      case 'success':
        console.log(`✅ ${consoleMessage}`, context);
        break;
      default:
        console.log(consoleMessage, context);
    }
  }

  static info(message: string, context?: Record<string, any>, operation?: string): void {
    this.log('info', message, context, operation);
  }

  static warning(message: string, context?: Record<string, any>, operation?: string): void {
    this.log('warning', message, context, operation);
  }

  static error(message: string, context?: Record<string, any>, operation?: string): void {
    this.log('error', message, context, operation);
  }

  static success(message: string, context?: Record<string, any>, operation?: string): void {
    this.log('success', message, context, operation);
  }

  static getLogs(operation?: string, level?: LogLevel): LogEntry[] {
    let filtered = [...this.logs];

    if (operation) {
      filtered = filtered.filter(log => log.operation === operation);
    }

    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }

    return filtered;
  }

  static clearLogs(): void {
    this.logs = [];
  }

  static getLogsSummary(): { total: number; byLevel: Record<LogLevel, number> } {
    const byLevel: Record<LogLevel, number> = {
      info: 0,
      warning: 0,
      error: 0,
      success: 0
    };

    this.logs.forEach(log => {
      byLevel[log.level]++;
    });

    return {
      total: this.logs.length,
      byLevel
    };
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Utility methods for common operations
  static logExcelProcessing(message: string, context?: Record<string, any>): void {
    this.info(message, context, 'excel-processing');
  }

  static logCalculation(message: string, context?: Record<string, any>): void {
    this.info(message, context, 'calculation');
  }

  static logNextEngineOperation(message: string, context?: Record<string, any>): void {
    this.info(message, context, 'next-engine');
  }

  static logTemplateOperation(message: string, context?: Record<string, any>): void {
    this.info(message, context, 'template');
  }
}