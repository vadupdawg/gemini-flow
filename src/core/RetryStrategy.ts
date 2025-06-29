// Advanced retry strategy with adaptive backoff
export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
  jitter?: boolean;
}

export interface RetryAnalytics {
  totalAttempts: number;
  successfulRetries: number;
  failedRetries: number;
  averageRetryDelay: number;
}

export class RetryStrategy {
  private defaultOptions: RetryOptions = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    factor: 2,
    jitter: true
  };
  
  private analytics: RetryAnalytics = {
    totalAttempts: 0,
    successfulRetries: 0,
    failedRetries: 0,
    averageRetryDelay: 0
  };
  
  constructor(options?: RetryOptions) {
    if (options) {
      this.defaultOptions = { ...this.defaultOptions, ...options };
    }
  }
  
  async executeWithAdaptiveRetry<T>(
    fn: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: Error;
    let delay = opts.initialDelay!;
    
    for (let attempt = 0; attempt <= opts.maxRetries!; attempt++) {
      try {
        this.analytics.totalAttempts++;
        const result = await fn();
        if (attempt > 0) {
          this.analytics.successfulRetries++;
        }
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === opts.maxRetries) {
          this.analytics.failedRetries++;
          throw lastError;
        }
        
        // Calculate next delay with jitter
        if (opts.jitter) {
          delay = delay * (0.5 + Math.random());
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Update delay for next attempt
        delay = Math.min(delay * opts.factor!, opts.maxDelay!);
      }
    }
    
    throw lastError!;
  }
  
  getAnalytics(): RetryAnalytics {
    return { ...this.analytics };
  }
}