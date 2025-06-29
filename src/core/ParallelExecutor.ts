import { Worker } from 'worker_threads';
import { WorkerPool } from './WorkerPool';
import { TaskQueue } from './TaskQueue';
import { Logger } from './Logger';
import { ui } from './UI';
import { EventEmitter } from 'events';

export interface ParallelTask {
  id: string;
  type: 'gemini' | 'tool' | 'analysis';
  data: any;
  priority: number;
  dependencies?: string[];
  retryCount?: number;
  maxRetries?: number;
  callback?: (result: any) => void;
}

export interface ParallelExecutionOptions {
  maxWorkers?: number;
  taskTimeout?: number;
  retryAttempts?: number;
  enableMonitoring?: boolean;
}

export interface ExecutionStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  activeTasks: number;
  queuedTasks: number;
  startTime: Date;
  avgExecutionTime: number;
}

export class ParallelExecutor extends EventEmitter {
  private workerPool: WorkerPool;
  private taskQueue: TaskQueue<ParallelTask>;
  private executingTasks: Map<string, ParallelTask>;
  private completedTasks: Map<string, any>;
  private stats: ExecutionStats;
  private options: ParallelExecutionOptions;
  private isRunning: boolean = false;

  constructor(options: ParallelExecutionOptions = {}) {
    super();
    this.options = {
      maxWorkers: options.maxWorkers || 4,
      taskTimeout: options.taskTimeout || 300000, // 5 minutes
      retryAttempts: options.retryAttempts || 3,
      enableMonitoring: options.enableMonitoring || true
    };

    this.workerPool = new WorkerPool({
      maxWorkers: this.options.maxWorkers!,
      taskTimeout: this.options.taskTimeout
    });

    this.taskQueue = new TaskQueue<ParallelTask>();
    this.executingTasks = new Map();
    this.completedTasks = new Map();
    
    this.stats = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      activeTasks: 0,
      queuedTasks: 0,
      startTime: new Date(),
      avgExecutionTime: 0
    };

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Worker pool events
    this.workerPool.on('taskComplete', ({ taskId, result }) => {
      this.handleTaskComplete(taskId, result);
    });

    this.workerPool.on('taskError', ({ taskId, error }) => {
      this.handleTaskError(taskId, error);
    });

    this.workerPool.on('workerError', (error) => {
      Logger.error('[ParallelExecutor]', `Worker error: ${error.message}`);
    });

    // Monitor performance
    if (this.options.enableMonitoring) {
      setInterval(() => this.updateStats(), 1000);
    }
  }

  /**
   * Submit a task for parallel execution
   */
  public async submitTask(task: ParallelTask): Promise<any> {
    return new Promise((resolve, reject) => {
      task.callback = (result) => {
        if (result.error) {
          reject(result.error);
        } else {
          resolve(result.data);
        }
      };

      this.taskQueue.enqueue(task);
      this.stats.totalTasks++;
      this.stats.queuedTasks++;
      
      this.emit('taskSubmitted', task);
      
      if (!this.isRunning) {
        this.start();
      }
    });
  }

  /**
   * Submit multiple tasks in batch
   */
  public async submitBatch(tasks: ParallelTask[]): Promise<any[]> {
    const promises = tasks.map(task => this.submitTask(task));
    return Promise.all(promises);
  }

  /**
   * Start the parallel executor
   */
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.stats.startTime = new Date();
    
    ui.section('Parallel Execution Started');
    ui.info(`Worker Pool: ${this.options.maxWorkers} workers`);
    
    this.processQueue();
  }

  /**
   * Stop the parallel executor
   */
  public async stop(): Promise<void> {
    this.isRunning = false;
    await this.workerPool.terminate();
    
    ui.success('Parallel Execution Stopped');
  }

  /**
   * Process the task queue
   */
  private async processQueue(): Promise<void> {
    while (this.isRunning) {
      // Check for available workers
      const availableWorkers = this.workerPool.getAvailableWorkerCount();
      if (availableWorkers === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      // Get next ready task
      const task = this.getNextReadyTask();
      if (!task) {
        // No tasks ready, wait
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      // Execute task
      this.executeTask(task);
    }
  }

  /**
   * Get next task that's ready to execute
   */
  private getNextReadyTask(): ParallelTask | null {
    const tasks = this.taskQueue.getAll();
    
    for (const task of tasks) {
      // Check if dependencies are satisfied
      if (this.areDependenciesSatisfied(task)) {
        this.taskQueue.remove(task);
        return task;
      }
    }
    
    return null;
  }

  /**
   * Check if task dependencies are satisfied
   */
  private areDependenciesSatisfied(task: ParallelTask): boolean {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true;
    }
    
    return task.dependencies.every(depId => this.completedTasks.has(depId));
  }

  /**
   * Execute a task on a worker
   */
  private async executeTask(task: ParallelTask): Promise<void> {
    this.executingTasks.set(task.id, task);
    this.stats.activeTasks++;
    this.stats.queuedTasks--;
    
    ui.agentStart(`worker-${task.id}`, `Executing ${task.type} task`);
    
    try {
      const result = await this.workerPool.executeTask({
        id: task.id,
        type: task.type,
        data: task.data
      });
      
      this.handleTaskComplete(task.id, result);
    } catch (error) {
      this.handleTaskError(task.id, error as Error);
    }
  }

  /**
   * Handle task completion
   */
  private handleTaskComplete(taskId: string, result: any): void {
    const task = this.executingTasks.get(taskId);
    if (!task) return;
    
    this.executingTasks.delete(taskId);
    this.completedTasks.set(taskId, result);
    
    this.stats.completedTasks++;
    this.stats.activeTasks--;
    
    ui.agentSuccess(`worker-${taskId}`, `Task completed`);
    
    // Execute callback
    if (task.callback) {
      task.callback({ data: result });
    }
    
    this.emit('taskComplete', { task, result });
  }

  /**
   * Handle task error
   */
  private async handleTaskError(taskId: string, error: Error): Promise<void> {
    const task = this.executingTasks.get(taskId);
    if (!task) return;
    
    task.retryCount = (task.retryCount || 0) + 1;
    
    if (task.retryCount <= (task.maxRetries || this.options.retryAttempts!)) {
      // Retry task
      ui.warning(`Retrying task ${taskId} (attempt ${task.retryCount})`);
      this.executingTasks.delete(taskId);
      this.stats.activeTasks--;
      
      // Add back to queue with delay
      setTimeout(() => {
        this.taskQueue.enqueue(task);
        this.stats.queuedTasks++;
      }, 1000 * task.retryCount);
    } else {
      // Task failed permanently
      this.executingTasks.delete(taskId);
      this.stats.failedTasks++;
      this.stats.activeTasks--;
      
      ui.agentError(`worker-${taskId}`, `Task failed: ${error.message}`);
      
      if (task.callback) {
        task.callback({ error });
      }
      
      this.emit('taskFailed', { task, error });
    }
  }

  /**
   * Update execution statistics
   */
  private updateStats(): void {
    if (this.stats.completedTasks > 0) {
      const totalTime = Date.now() - this.stats.startTime.getTime();
      this.stats.avgExecutionTime = totalTime / this.stats.completedTasks;
    }
    
    this.emit('statsUpdate', this.getStats());
  }

  /**
   * Get current execution statistics
   */
  public getStats(): ExecutionStats {
    return { ...this.stats };
  }

  /**
   * Wait for all tasks to complete
   */
  public async waitForCompletion(): Promise<void> {
    while (this.stats.activeTasks > 0 || this.stats.queuedTasks > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Enable or disable parallel mode
   */
  public setParallelMode(enabled: boolean): void {
    if (enabled) {
      this.workerPool.setMaxWorkers(this.options.maxWorkers!);
    } else {
      this.workerPool.setMaxWorkers(1);
    }
  }
}