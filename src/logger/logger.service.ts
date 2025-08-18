import { Injectable, LoggerService } from '@nestjs/common';
import * as os from 'os';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class AppLogger implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    const logDir = 'logs';

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            ...meta,
            application: 'LeaderboardAPI',
            environment: process.env.NODE_ENV || 'development',
            machineName: os.hostname(),
            threadId: process.pid,
          });
        }),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
        new winston.transports.DailyRotateFile({
          dirname: logDir,
          filename: 'leaderboard-%DATE%.json',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '7d',
        }),
      ],
    });
  }

  log(message: string, context?: any) {
    this.logger.info(message, context);
  }

  error(message: string, trace?: string, context?: any) {
    this.logger.error(message, { trace, ...context });
  }

  warn(message: string, context?: any) {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: any) {
    this.logger.debug(message, context);
  }

  verbose(message: string, context?: any) {
    this.logger.verbose(message, context);
  }

  // Winston logger'ın tüm metodlarına erişim
  info(message: string, context?: any) {
    this.logger.info(message, context);
  }
}
