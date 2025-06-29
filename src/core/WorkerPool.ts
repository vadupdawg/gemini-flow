import { Worker } from 'worker_threads';
import { EventEmitter } from 'events';
import * as path from 'path';
import { Logger } from './Logger';

export interface WorkerTask {
  id: string;
  type: string;
  data: any;
}

export interface WorkerPoolOptions {
  maxWorkers: number;
  taskTimeout?: number;
  workerScript?: string;
}

interface WorkerInfo {
  id: number;
  worker: Worker;
  busy: boolean;
  currentTask?: WorkerTask;
  startTime?: number;
}

export class WorkerPool extends EventEmitter {
  private workers: Map<number, WorkerInfo> = new Map();
  private taskQueue: WorkerTask[] = [];
  private workerIdCounter = 0;
  private options: WorkerPoolOptions;
  private terminated = false;

  constructor(options: WorkerPoolOptions) {
    super();
    this.options = {
      ...options,
      taskTimeout: options.taskTimeout || 300000,
      workerScript: options.workerScript || path.join(__dirname, 'worker.js')
    };
    
    this.initializeWorkers();
  }

  /**
   * Initialize the worker pool
   */
  private initializeWorkers(): void {
    for (let i = 0; i < this.options.maxWorkers; i++) {
      this.createWorker();
    }
  }

  /**
   * Create a new worker
   */
  private createWorker(): void {
    const workerId = this.workerIdCounter++;
    const worker = new Worker(this.options.workerScript!, {
      workerData: { workerId }
    });

    const workerInfo: WorkerInfo = {
      id: workerId,
      worker,
      busy: false
    };

    // Setup worker event handlers
    worker.on('message', (message) => {
      this.handleWorkerMessage(workerId, message);
    });

    worker.on('error', (error) => {
      this.handleWorkerError(workerId, error);
    });

    worker.on('exit', (code) => {
      this.handleWorkerExit(workerId, code);
    });

    this.workers.set(workerId, workerInfo);
    Logger.log(`[WorkerPool]`, `Created worker ${workerId}`);
  }

  /**
   * Execute a task on an available worker
   */
  public async executeTask(task: WorkerTask): Promise<any> {
    return new Promise((resolve, reject) => {
      const worker = this.getAvailableWorker();
      
      if (!worker) {
        // Queue the task
        this.taskQueue.push(task);
        this.once(`worker-available`, () => {
          this.executeTask(task).then(resolve).catch(reject);
        });
        return;
      }

      // Mark worker as busy
      worker.busy = true;
      worker.currentTask = task;
      worker.startTime = Date.now();

      // Setup timeout
      const timeout = setTimeout(() => {
        reject(new Error(`Task ${task.id} timed out`));
        this.terminateWorker(worker.id);
      }, this.options.taskTimeout!);

      // Setup one-time handlers for this task
      const messageHandler = (message: any) => {
        if (message.taskId === task.id) {
          clearTimeout(timeout);
          worker.worker.off('message', messageHandler);
          
          if (message.error) {
            reject(new Error(message.error));
          } else {
            resolve(message.result);
          }
          
          // Mark worker as available
          worker.busy = false;
          worker.currentTask = undefined;
          worker.startTime = undefined;
          
          this.emit('worker-available', worker.id);
          this.processQueue();
        }
      };

      worker.worker.on('message', messageHandler);

      // Send task to worker
      worker.worker.postMessage({
        type: 'execute',
        task
      });
    });
  }

  /**
   * Get an available worker
   */
  private getAvailableWorker(): WorkerInfo | null {
    for (const worker of this.workers.values()) {
      if (!worker.busy) {
        return worker;
      }
    }
    return null;
  }

  /**
   * Get count of available workers
   */
  public getAvailableWorkerCount(): number {
    let count = 0;
    for (const worker of this.workers.values()) {
      if (!worker.busy) count++;
    }
    return count;
  }

  /**
   * Process queued tasks
   */
  private processQueue(): void {
    while (this.taskQueue.length > 0) {
      const worker = this.getAvailableWorker();
      if (!worker) break;
      
      const task = this.taskQueue.shift()!;
      this.executeTask(task);
    }
  }

  /**
   * Handle worker messages
   */
  private handleWorkerMessage(workerId: number, message: any): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    switch (message.type) {
      case 'ready':
        Logger.log(`[WorkerPool]`, `Worker ${workerId} is ready`);
        break;
      
      case 'log':
        Logger.log(`[Worker ${workerId}]`, message.data);
        break;
      
      case 'result':
        if (worker.currentTask) {
          this.emit('taskComplete', {
            taskId: worker.currentTask.id,
            result: message.data
          });
        }
        break;
      
      case 'error':
        if (worker.currentTask) {
          this.emit('taskError', {
            taskId: worker.currentTask.id,
            error: new Error(message.data)
          });
        }
        break;
    }
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(workerId: number, error: Error): void {
    Logger.error(`[WorkerPool]`, `Worker ${workerId} error: ${error.message}`);
    
    const worker = this.workers.get(workerId);
    if (worker?.currentTask) {
      this.emit('taskError', {
        taskId: worker.currentTask.id,
        error
      });
    }
    
    this.emit('workerError', error);
    
    // Replace the worker
    if (!this.terminated) {
      this.terminateWorker(workerId);
      this.createWorker();
    }
  }

  /**
   * Handle worker exit
   */
  private handleWorkerExit(workerId: number, code: number): void {
    Logger.log(`[WorkerPool]`, `Worker ${workerId} exited with code ${code}`);
    
    const worker = this.workers.get(workerId);
    if (worker?.currentTask && code !== 0) {
      this.emit('taskError', {
        taskId: worker.currentTask.id,
        error: new Error(`Worker exited with code ${code}`)
      });
    }
    
    this.workers.delete(workerId);
    
    // Replace the worker if not terminated
    if (!this.terminated && code !== 0) {
      this.createWorker();
    }
  }

  /**
   * Terminate a specific worker
   */
  private async terminateWorker(workerId: number): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker) return;
    
    try {
      await worker.worker.terminate();
    } catch (error) {
      Logger.error(`[WorkerPool]`, `Error terminating worker ${workerId}: ${(error as Error).message}`);
    }
    
    this.workers.delete(workerId);
  }

  /**
   * Terminate all workers
   */
  public async terminate(): Promise<void> {
    this.terminated = true;
    
    const terminatePromises = Array.from(this.workers.keys()).map(
      workerId => this.terminateWorker(workerId)
    );
    
    await Promise.all(terminatePromises);
    
    Logger.log(`[WorkerPool]`, 'All workers terminated');
  }

  /**
   * Set the maximum number of workers
   */
  public setMaxWorkers(maxWorkers: number): void {
    const currentCount = this.workers.size;
    
    if (maxWorkers > currentCount) {
      // Add more workers
      for (let i = currentCount; i < maxWorkers; i++) {
        this.createWorker();
      }
    } else if (maxWorkers < currentCount) {
      // Remove excess workers
      const toRemove = currentCount - maxWorkers;
      const workerIds = Array.from(this.workers.keys());
      
      for (let i = 0; i < toRemove; i++) {
        const workerId = workerIds[i];
        const worker = this.workers.get(workerId);
        
        // Only remove if not busy
        if (worker && !worker.busy) {
          this.terminateWorker(workerId);
        }
      }
    }
    
    this.options.maxWorkers = maxWorkers;
  }

  /**
   * Get worker statistics
   */
  public getStats(): {
    totalWorkers: number;
    busyWorkers: number;
    queuedTasks: number;
  } {
    let busyWorkers = 0;
    for (const worker of this.workers.values()) {
      if (worker.busy) busyWorkers++;
    }
    
    return {
      totalWorkers: this.workers.size,
      busyWorkers,
      queuedTasks: this.taskQueue.length
    };
  }
}