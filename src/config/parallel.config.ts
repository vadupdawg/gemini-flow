export interface ParallelExecutionConfig {
  /**
   * Enable parallel execution using worker threads
   */
  enabled: boolean;

  /**
   * Maximum number of worker threads
   * Default: Number of CPU cores
   */
  maxWorkers?: number;

  /**
   * Task timeout in milliseconds
   * Default: 300000 (5 minutes)
   */
  taskTimeout?: number;

  /**
   * Number of retry attempts for failed tasks
   * Default: 3
   */
  retryAttempts?: number;

  /**
   * Enable performance monitoring
   * Default: true
   */
  enableMonitoring?: boolean;

  /**
   * Batch size for processing multiple tasks
   * Default: 10
   */
  batchSize?: number;

  /**
   * Memory limit per worker in MB
   * Default: 512
   */
  memoryLimit?: number;

  /**
   * Worker recycling after N tasks
   * Default: 100
   */
  recycleAfterTasks?: number;
}

/**
 * Default parallel execution configuration
 */
export const defaultParallelConfig: ParallelExecutionConfig = {
  enabled: true,
  maxWorkers: require('os').cpus().length,
  taskTimeout: 300000, // 5 minutes
  retryAttempts: 3,
  enableMonitoring: true,
  batchSize: 10,
  memoryLimit: 512,
  recycleAfterTasks: 100
};

/**
 * Load parallel configuration from environment or use defaults
 */
export function loadParallelConfig(): ParallelExecutionConfig {
  const config: ParallelExecutionConfig = {
    enabled: process.env.PARALLEL_EXECUTION_ENABLED !== 'false',
    maxWorkers: process.env.PARALLEL_MAX_WORKERS 
      ? parseInt(process.env.PARALLEL_MAX_WORKERS, 10) 
      : defaultParallelConfig.maxWorkers,
    taskTimeout: process.env.PARALLEL_TASK_TIMEOUT 
      ? parseInt(process.env.PARALLEL_TASK_TIMEOUT, 10) 
      : defaultParallelConfig.taskTimeout,
    retryAttempts: process.env.PARALLEL_RETRY_ATTEMPTS 
      ? parseInt(process.env.PARALLEL_RETRY_ATTEMPTS, 10) 
      : defaultParallelConfig.retryAttempts,
    enableMonitoring: process.env.PARALLEL_MONITORING !== 'false',
    batchSize: process.env.PARALLEL_BATCH_SIZE 
      ? parseInt(process.env.PARALLEL_BATCH_SIZE, 10) 
      : defaultParallelConfig.batchSize,
    memoryLimit: process.env.PARALLEL_MEMORY_LIMIT 
      ? parseInt(process.env.PARALLEL_MEMORY_LIMIT, 10) 
      : defaultParallelConfig.memoryLimit,
    recycleAfterTasks: process.env.PARALLEL_RECYCLE_AFTER 
      ? parseInt(process.env.PARALLEL_RECYCLE_AFTER, 10) 
      : defaultParallelConfig.recycleAfterTasks
  };

  // Validate configuration
  if (config.maxWorkers! < 1) {
    config.maxWorkers = 1;
  }

  if (config.maxWorkers! > 16) {
    console.warn('[ParallelConfig] maxWorkers capped at 16 to prevent resource exhaustion');
    config.maxWorkers = 16;
  }

  return config;
}

/**
 * Performance profiles for different use cases
 */
export const performanceProfiles = {
  /**
   * Conservative profile for low-resource environments
   */
  conservative: {
    enabled: true,
    maxWorkers: 2,
    taskTimeout: 600000, // 10 minutes
    retryAttempts: 2,
    enableMonitoring: false,
    batchSize: 5,
    memoryLimit: 256,
    recycleAfterTasks: 50
  },

  /**
   * Balanced profile for general use
   */
  balanced: {
    enabled: true,
    maxWorkers: Math.ceil(require('os').cpus().length / 2),
    taskTimeout: 300000, // 5 minutes
    retryAttempts: 3,
    enableMonitoring: true,
    batchSize: 10,
    memoryLimit: 512,
    recycleAfterTasks: 100
  },

  /**
   * Performance profile for high-throughput scenarios
   */
  performance: {
    enabled: true,
    maxWorkers: require('os').cpus().length,
    taskTimeout: 180000, // 3 minutes
    retryAttempts: 2,
    enableMonitoring: true,
    batchSize: 20,
    memoryLimit: 1024,
    recycleAfterTasks: 200
  },

  /**
   * Maximum performance profile (use with caution)
   */
  maximum: {
    enabled: true,
    maxWorkers: require('os').cpus().length * 2,
    taskTimeout: 120000, // 2 minutes
    retryAttempts: 1,
    enableMonitoring: false,
    batchSize: 50,
    memoryLimit: 2048,
    recycleAfterTasks: 500
  }
};

/**
 * Get performance profile by name
 */
export function getPerformanceProfile(profileName: string): ParallelExecutionConfig {
  const profiles: { [key: string]: ParallelExecutionConfig } = performanceProfiles;
  return profiles[profileName] || performanceProfiles.balanced;
}