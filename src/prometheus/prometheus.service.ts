import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram } from 'prom-client';

@Injectable()
export class PrometheusService {
  // HTTP Metrics
  private readonly httpRequestsTotal = new Counter({
    name: 'leaderboard_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status_code', 'status_class'],
  });

  private readonly httpRequestDuration = new Histogram({
    name: 'leaderboard_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'path', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
  });

  private readonly httpRequestsInProgress = new Gauge({
    name: 'leaderboard_http_requests_in_progress',
    help: 'Number of HTTP requests currently in progress',
    labelNames: ['method', 'path'],
  });

  // Business Metrics
  private readonly leaderboardScoreSubmissions = new Counter({
    name: 'leaderboard_score_submissions_total',
    help: 'Total number of score submissions',
    labelNames: ['user_id', 'score_range', 'game_mode'],
  });

  private readonly leaderboardBonusUsage = new Counter({
    name: 'leaderboard_bonus_usage_total',
    help: 'Total number of bonus usage',
    labelNames: ['bonus_type', 'game_mode'],
  });

  private readonly leaderboardBonusAmount = new Histogram({
    name: 'leaderboard_bonus_amount',
    help: 'Bonus amount distribution',
    labelNames: ['bonus_type', 'game_mode'],
    buckets: [0, 10, 50, 100, 500, 1000],
  });

  // Security Metrics
  private readonly replayAttackAttempts = new Counter({
    name: 'leaderboard_replay_attack_attempts_total',
    help: 'Total number of replay attack attempts',
    labelNames: ['user_id', 'reason', 'endpoint'],
  });

  private readonly idempotencyConflicts = new Counter({
    name: 'leaderboard_idempotency_conflicts_total',
    help: 'Total number of idempotency conflicts',
    labelNames: ['user_id', 'endpoint'],
  });

  private readonly requestTimestampAge = new Histogram({
    name: 'leaderboard_request_timestamp_age_seconds',
    help: 'Request timestamp age in seconds',
    labelNames: ['endpoint', 'status'],
    buckets: [1, 5, 10, 30, 60, 300, 600],
  });

  private readonly securityValidationFailures = new Counter({
    name: 'leaderboard_security_validation_failures_total',
    help: 'Total number of security validation failures',
    labelNames: ['validation_type', 'user_id', 'endpoint'],
  });

  // Auth Metrics
  private readonly loginAttempts = new Counter({
    name: 'leaderboard_login_attempts_total',
    help: 'Total number of login attempts',
    labelNames: ['status'],
  });

  private readonly activeUsers = new Gauge({
    name: 'leaderboard_active_users',
    help: 'Number of active users',
  });

  // HTTP Metrics Methods
  recordHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
  ) {
    const statusClass = Math.floor(statusCode / 100) * 100;

    this.httpRequestsTotal.inc({
      method,
      path,
      status_code: statusCode.toString(),
      status_class: statusClass.toString(),
    });
    this.httpRequestDuration.observe(
      { method, path, status_code: statusCode.toString() },
      duration / 1000,
    );
  }

  startHttpRequest(method: string, path: string) {
    this.httpRequestsInProgress.inc({ method, path });
  }

  endHttpRequest(method: string, path: string) {
    this.httpRequestsInProgress.dec({ method, path });
  }

  // Business Metrics Methods
  recordScoreSubmission(userId: string, score: number, gameMode: string) {
    const scoreRange = this.getScoreRange(score);
    this.leaderboardScoreSubmissions.inc({
      user_id: userId,
      score_range: scoreRange,
      game_mode: gameMode,
    });
  }

  recordBonusUsage(bonusType: string, gameMode: string, amount: number) {
    this.leaderboardBonusUsage.inc({
      bonus_type: bonusType,
      game_mode: gameMode,
    });
    this.leaderboardBonusAmount.observe(
      { bonus_type: bonusType, game_mode: gameMode },
      amount,
    );
  }

  // Security Metrics Methods
  recordReplayAttackAttempt(userId: string, reason: string, endpoint: string) {
    this.replayAttackAttempts.inc({ user_id: userId, reason, endpoint });
  }

  recordIdempotencyConflict(userId: string, endpoint: string) {
    this.idempotencyConflicts.inc({ user_id: userId, endpoint });
  }

  recordRequestTimestampAge(
    endpoint: string,
    status: string,
    ageSeconds: number,
  ) {
    this.requestTimestampAge.observe({ endpoint, status }, ageSeconds);
  }

  recordSecurityValidationFailure(
    validationType: string,
    userId: string,
    endpoint: string,
  ) {
    this.securityValidationFailures.inc({
      validation_type: validationType,
      user_id: userId,
      endpoint,
    });
  }

  // Auth Metrics Methods
  recordLoginAttempt(status: 'success' | 'failed') {
    this.loginAttempts.inc({ status });
  }

  setActiveUsers(count: number) {
    this.activeUsers.set(count);
  }

  private getScoreRange(score: number): string {
    if (score < 1000) return '0-999';
    if (score < 5000) return '1000-4999';
    if (score < 10000) return '5000-9999';
    if (score < 50000) return '10000-49999';
    return '50000+';
  }
}
