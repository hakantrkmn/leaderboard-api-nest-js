import * as winston from 'winston';
import 'winston-daily-rotate-file';

export const loggerConfig = {
  format: winston.format.combine(
    winston.format.timestamp(),
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-require-imports
        machineName: require('os').hostname(),
        threadId: process.pid,
      });
    }),
  ),
  transports: [
    // Console transport (development için)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),

    // File transport (daily rotation)
    new winston.transports.DailyRotateFile({
      filename: 'logs/leaderboard-%DATE%.json',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
  level: process.env.LOG_LEVEL || 'info',
};
