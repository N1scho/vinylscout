export class AppError extends Error {
  constructor(message) {
    super(message);
    this.name = new.target.name;
  }
}

export class NetworkError extends AppError {}

export class RateLimitError extends AppError {
  constructor(retryAfterSeconds = 60) {
    super(`Rate limit erreicht. Bitte in ${retryAfterSeconds} Sekunden erneut versuchen.`);
    this.retryAfter = retryAfterSeconds;
  }
}

export class ApiError extends AppError {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
