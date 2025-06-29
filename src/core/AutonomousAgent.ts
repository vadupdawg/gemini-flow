import { Agent } from './Agent';
import { Memory } from './Memory';
import { ToDoManager } from './ToDoManager';
import { Orchestrator } from './Orchestrator';
import { ParallelExecutor, ParallelTask } from './ParallelExecutor';
import { Logger } from './Logger';
import { ui } from './UI';
import { Executor } from './executor';
import * as fs from 'fs';
import * as path from 'path';

interface TaskPlan {
  id: string;
  description: string;
  type: 'research' | 'design' | 'implement' | 'test' | 'deploy' | 'analyze';
  dependencies: string[];
  estimatedTime: number;
  agent: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  retryCount?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
}

interface ExecutionContext {
  objective: string;
  startTime: Date;
  endTime?: Date;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  learnings: string[];
  errors: Error[];
}

export class AutonomousAgent {
  private memory: Memory;
  private orchestrator: Orchestrator;
  private toDoManager: ToDoManager;
  private executor: Executor;
  private parallelExecutor?: ParallelExecutor;
  private apiKey: string;
  private context: ExecutionContext;
  private maxRetries: number = 3;
  private parallelExecutionEnabled: boolean = true;
  private maxParallelWorkers: number = 6;

  constructor(apiKey: string, enableParallel: boolean = true) {
    this.apiKey = apiKey;
    this.memory = new Memory();
    this.toDoManager = new ToDoManager();
    this.orchestrator = new Orchestrator(apiKey, this.toDoManager, enableParallel);
    this.executor = new Executor();
    this.parallelExecutionEnabled = enableParallel;
    
    if (enableParallel) {
      this.parallelExecutor = new ParallelExecutor({
        maxWorkers: this.maxParallelWorkers,
        enableMonitoring: true,
        taskTimeout: 600000 // 10 minutes
      });
    }
    
    this.context = {
      objective: '',
      startTime: new Date(),
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      learnings: [],
      errors: []
    };
  }

  /**
   * Execute a complex objective autonomously
   */
  async execute(objective: string): Promise<void> {
    ui.header('Autonomous Execution', objective);
    this.context.objective = objective;
    this.context.startTime = new Date();

    try {
      // Step 1: Analyze and decompose the objective
      ui.agentStart('analyzer', 'Analyzing objective and creating execution plan...');
      const plan = await this.decomposeObjective(objective);
      ui.agentSuccess('analyzer', `Created plan with ${plan.length} tasks`);
      
      // Step 2: Optimize plan based on past learnings
      ui.agentStart('optimizer', 'Optimizing plan based on past experiences...');
      const optimizedPlan = await this.optimizePlan(plan);
      ui.agentSuccess('optimizer', 'Plan optimized');
      
      // Step 3: Execute plan
      ui.section('Executing Plan');
      await this.executePlan(optimizedPlan);
      
      // Step 4: Learn from execution
      await this.learnFromExecution();
      
      // Step 5: Report results
      this.reportResults();
      
    } catch (error) {
      ui.error(`Autonomous execution failed: ${(error as Error).message}`);
      this.context.errors.push(error as Error);
      await this.recoverFromError(error as Error);
    }
  }

  /**
   * Decompose a complex objective into executable tasks
   */
  private async decomposeObjective(objective: string): Promise<TaskPlan[]> {
    const decomposerPrompt = `
You are an expert task decomposer. Break down the following objective into a detailed execution plan.
Each task should be specific, actionable, and include:
- Unique ID
- Clear description
- Task type (research, design, implement, test, deploy, analyze)
- Dependencies (IDs of tasks that must complete first)
- Estimated time in minutes
- Best agent for the task
- Priority level

Objective: ${objective}

Return ONLY a JSON array of tasks. Example:
[
  {
    "id": "task-1",
    "description": "Research best practices for X",
    "type": "research",
    "dependencies": [],
    "estimatedTime": 30,
    "agent": "researcher",
    "priority": "high"
  }
]
`;

    const result = await this.executor.run({
      task: decomposerPrompt,
      systemPrompt: 'You are a task decomposition expert. Always return valid JSON.',
      apiKey: this.apiKey
    });

    if (!result.success) {
      throw new Error(`Failed to decompose objective: ${result.error}`);
    }

    try {
      // Extract JSON from response
      let jsonString = result.output;
      const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
      
      const tasks: TaskPlan[] = JSON.parse(jsonString);
      
      // Validate and enhance tasks
      return tasks.map((task, index) => ({
        ...task,
        id: task.id || `task-${index + 1}`,
        status: 'pending',
        retryCount: 0
      }));
    } catch (e) {
      throw new Error(`Failed to parse decomposition plan: ${(e as Error).message}`);
    }
  }

  /**
   * Optimize plan based on past learnings
   */
  private async optimizePlan(plan: TaskPlan[]): Promise<TaskPlan[]> {
    // Retrieve past execution data
    const allData = this.memory.getAll();
    const pastExecutions = Object.entries(allData)
      .filter(([key]) => key.startsWith('execution_'))
      .slice(0, 10)
      .map(([key, value]) => ({ key, value }));
    
    if (pastExecutions.length === 0) {
      return plan; // No optimizations possible yet
    }

    // Analyze past failures and successes
    const insights = this.analyzePastExecutions(pastExecutions);
    
    // Apply optimizations
    return plan.map(task => {
      // Adjust time estimates based on past performance
      const similarTasks = insights.filter(i => i.type === task.type);
      if (similarTasks.length > 0) {
        const avgTime = similarTasks.reduce((sum, t) => sum + t.actualTime, 0) / similarTasks.length;
        task.estimatedTime = Math.ceil(avgTime * 1.1); // Add 10% buffer
      }
      
      // Adjust priorities based on failure rates
      const failureRate = this.getFailureRate(task.type, insights);
      if (failureRate > 0.3) {
        task.priority = 'critical'; // High failure tasks need more attention
      }
      
      return task;
    });
  }

  /**
   * Execute the plan with parallel execution where possible
   */
  private async executePlan(plan: TaskPlan[]): Promise<void> {
    this.context.totalTasks = plan.length;
    
    if (this.parallelExecutionEnabled && this.parallelExecutor) {
      await this.executePlanParallel(plan);
    } else {
      await this.executePlanSequential(plan);
    }
  }

  /**
   * Execute plan using parallel executor
   */
  private async executePlanParallel(plan: TaskPlan[]): Promise<void> {
    if (!this.parallelExecutor) {
      throw new Error('Parallel executor not initialized');
    }
    
    // Start parallel executor
    this.parallelExecutor.start();
    
    // Track task completion
    const taskResults = new Map<string, any>();
    const taskPromises = new Map<string, Promise<any>>();
    
    // Create parallel tasks
    const parallelTasks: ParallelTask[] = plan.map(task => ({
      id: task.id,
      type: 'gemini',
      priority: this.calculateTaskPriority(task),
      dependencies: task.dependencies,
      maxRetries: this.maxRetries,
      data: {
        apiKey: this.apiKey,
        prompt: this.buildTaskPrompt(task),
        systemPrompt: this.getAgentPrompt(task.agent),
        taskInfo: task
      }
    }));
    
    // Submit all tasks and track promises
    for (const pTask of parallelTasks) {
      const promise = this.parallelExecutor!.submitTask(pTask)
        .then(result => {
          taskResults.set(pTask.id, result);
          this.updateTaskStatus(pTask.id, 'completed', result);
          this.context.completedTasks++;
          return result;
        })
        .catch(error => {
          this.updateTaskStatus(pTask.id, 'failed', error.message);
          this.context.failedTasks++;
          throw error;
        });
      
      taskPromises.set(pTask.id, promise);
    }
    
    // Wait for all tasks to complete
    try {
      await Promise.all(Array.from(taskPromises.values()));
    } catch (error) {
      // Some tasks failed, but continue
      Logger.warn('[AutonomousAgent]', `Some tasks failed during parallel execution`);
    }
    
    // Update plan results
    for (const task of plan) {
      if (taskResults.has(task.id)) {
        task.result = taskResults.get(task.id);
        task.status = 'completed';
      }
    }
    
    // Stop parallel executor
    await this.parallelExecutor!.stop();
  }

  /**
   * Execute plan sequentially (fallback)
   */
  private async executePlanSequential(plan: TaskPlan[]): Promise<void> {
    const taskMap = new Map(plan.map(t => [t.id, t]));
    const queue = [...plan];
    const inProgress = new Set<string>();
    const completed = new Set<string>();
    
    while (queue.length > 0 || inProgress.size > 0) {
      const ready = queue.filter(task => 
        task.dependencies.every(dep => completed.has(dep)) &&
        !inProgress.has(task.id)
      );
      
      if (ready.length === 0 && inProgress.size === 0) {
        throw new Error('Circular dependency detected in task plan');
      }
      
      const toExecute = ready.slice(0, 1);
      
      const promises = toExecute.map(async task => {
        inProgress.add(task.id);
        queue.splice(queue.indexOf(task), 1);
        
        try {
          await this.executeTask(task);
          completed.add(task.id);
          this.context.completedTasks++;
        } catch (error) {
          await this.handleTaskFailure(task, error as Error);
        } finally {
          inProgress.delete(task.id);
        }
      });
      
      if (promises.length > 0) {
        await Promise.all(promises);
      }
      
      this.updateProgress();
    }
  }

  /**
   * Calculate task priority based on various factors
   */
  private calculateTaskPriority(task: TaskPlan): number {
    let priority = 5; // Base priority
    
    // Critical tasks get highest priority
    if (task.priority === 'critical') priority += 5;
    else if (task.priority === 'high') priority += 3;
    else if (task.priority === 'low') priority -= 2;
    
    // Tasks with no dependencies get priority boost
    if (task.dependencies.length === 0) priority += 2;
    
    // Research tasks get slight priority to gather info early
    if (task.type === 'research') priority += 1;
    
    return Math.max(1, Math.min(10, priority));
  }

  /**
   * Build task prompt with context
   */
  private buildTaskPrompt(task: TaskPlan): string {
    const context = this.getTaskContext(task);
    return `${task.description}\n\nContext:\n${context}`;
  }

  /**
   * Update task status in memory
   */
  private updateTaskStatus(taskId: string, status: string, result?: any): void {
    const task = this.memory.get(`task_${taskId}`);
    if (task) {
      task.status = status;
      if (result) task.result = result;
      this.memory.set(`task_${taskId}`, task);
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: TaskPlan): Promise<void> {
    ui.agentStart(task.agent, `${task.description} (${task.estimatedTime}min)`);
    
    const startTime = Date.now();
    
    try {
      // Get agent-specific prompt
      const agentPrompt = this.getAgentPrompt(task.agent);
      
      // Execute with context from memory
      const context = this.getTaskContext(task);
      const fullTask = `${task.description}\n\nContext:\n${context}`;
      
      const result = await this.executor.run({
        task: fullTask,
        systemPrompt: agentPrompt,
        apiKey: this.apiKey
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Task execution failed');
      }
      
      // Store result in memory
      const executionTime = (Date.now() - startTime) / 1000 / 60; // minutes
      task.result = result.output;
      task.status = 'completed';
      
      this.memory.set(`task_${task.id}`, {
        task,
        executionTime,
        timestamp: new Date().toISOString()
      });
      
      ui.agentSuccess(task.agent, `Completed in ${executionTime.toFixed(1)}min`);
      
    } catch (error) {
      const executionTime = (Date.now() - startTime) / 1000 / 60;
      ui.agentError(task.agent, `Failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Handle task failure with retry logic
   */
  private async handleTaskFailure(task: TaskPlan, error: Error): Promise<void> {
    task.retryCount = (task.retryCount || 0) + 1;
    
    if ((task.retryCount || 0) <= this.maxRetries) {
      ui.warning(`Retrying task ${task.id} (attempt ${task.retryCount}/${this.maxRetries})`);
      
      // Add back to queue with delay
      await new Promise(resolve => setTimeout(resolve, 2000 * (task.retryCount || 1)));
      
      try {
        if (this.parallelExecutionEnabled && this.parallelExecutor) {
          // Retry with parallel executor
          const pTask: ParallelTask = {
            id: task.id,
            type: 'gemini',
            priority: this.calculateTaskPriority(task) + 1, // Boost priority for retry
            dependencies: task.dependencies,
            data: {
              apiKey: this.apiKey,
              prompt: this.buildTaskPrompt(task),
              systemPrompt: this.getAgentPrompt(task.agent),
              taskInfo: task
            }
          };
          
          const result = await this.parallelExecutor.submitTask(pTask);
          task.result = result;
          task.status = 'completed';
          this.context.completedTasks++;
        } else {
          await this.executeTask(task);
          this.context.completedTasks++;
        }
      } catch (retryError) {
        await this.handleTaskFailure(task, retryError as Error);
      }
    } else {
      task.status = 'failed';
      this.context.failedTasks++;
      this.context.errors.push(error);
      
      // Try to find alternative approach
      const alternative = await this.findAlternativeApproach(task, error);
      if (alternative) {
        ui.info('Found alternative approach, adding to queue');
        // Add alternative task to execution
        await this.executeTask(alternative);
      }
    }
  }

  /**
   * Find alternative approach for failed task
   */
  private async findAlternativeApproach(task: TaskPlan, error: Error): Promise<TaskPlan | null> {
    const prompt = `
Task failed: ${task.description}
Error: ${error.message}

Suggest an alternative approach to achieve the same goal.
Return a new task definition in JSON format, or null if no alternative exists.
`;

    try {
      const result = await this.executor.run({
        task: prompt,
        systemPrompt: 'You are a problem-solving expert. Find creative alternatives.',
        apiKey: this.apiKey
      });
      
      if (result.success && result.output !== 'null') {
        const alternative = JSON.parse(result.output);
        return {
          ...alternative,
          id: `${task.id}-alt`,
          retryCount: 0,
          status: 'pending'
        };
      }
    } catch (e) {
      // No alternative found
    }
    
    return null;
  }

  /**
   * Get context for task execution
   */
  private getTaskContext(task: TaskPlan): string {
    const allData = this.memory.getAll();
    const relatedMemory = Object.entries(allData)
      .filter(([key, value]) => key.includes(task.type))
      .slice(0, 5)
      .map(([key, value]) => ({ key, value }));
    const dependencies = task.dependencies
      .map(depId => this.memory.get(`task_${depId}`))
      .filter(Boolean);
    
    let context = '';
    
    if (dependencies.length > 0) {
      context += 'Previous task results:\n';
      dependencies.forEach(dep => {
        context += `- ${dep.task.description}: ${dep.task.result?.substring(0, 200)}...\n`;
      });
    }
    
    if (relatedMemory.length > 0) {
      context += '\nRelated past experiences:\n';
      relatedMemory.forEach(mem => {
        context += `- ${mem.key}: ${JSON.stringify(mem.value).substring(0, 100)}...\n`;
      });
    }
    
    return context;
  }

  /**
   * Learn from execution
   */
  private async learnFromExecution(): Promise<void> {
    const execution = {
      objective: this.context.objective,
      startTime: this.context.startTime,
      endTime: new Date(),
      totalTasks: this.context.totalTasks,
      completedTasks: this.context.completedTasks,
      failedTasks: this.context.failedTasks,
      successRate: this.context.completedTasks / this.context.totalTasks,
      errors: this.context.errors.map(e => e.message),
      duration: (new Date().getTime() - this.context.startTime.getTime()) / 1000 / 60 // minutes
    };
    
    // Store execution summary
    this.memory.set(`execution_${Date.now()}`, execution);
    
    // Extract learnings
    if (execution.successRate < 0.8) {
      this.context.learnings.push('Need better error handling and recovery strategies');
    }
    
    if (execution.duration > 60) {
      this.context.learnings.push('Consider breaking down into smaller sub-objectives');
    }
    
    // Store learnings
    if (this.context.learnings.length > 0) {
      const existingLearnings = this.memory.get('learnings') || [];
      this.memory.set('learnings', [...existingLearnings, ...this.context.learnings]);
    }
  }

  /**
   * Report execution results
   */
  private reportResults(): void {
    ui.section('Execution Summary');
    
    const duration = (new Date().getTime() - this.context.startTime.getTime()) / 1000 / 60;
    const successRate = (this.context.completedTasks / this.context.totalTasks * 100).toFixed(1);
    
    ui.success(`Objective completed in ${duration.toFixed(1)} minutes`);
    ui.info(`Success rate: ${successRate}% (${this.context.completedTasks}/${this.context.totalTasks} tasks)`);
    
    if (this.context.failedTasks > 0) {
      ui.warning(`Failed tasks: ${this.context.failedTasks}`);
    }
    
    if (this.context.learnings.length > 0) {
      ui.subsection('Learnings for next time');
      this.context.learnings.forEach(learning => ui.dim(`• ${learning}`));
    }
  }

  /**
   * Analyze past executions for insights
   */
  private analyzePastExecutions(executions: any[]): any[] {
    // Aggregate task performance data
    const taskPerformance: any[] = [];
    
    executions.forEach(exec => {
      if (exec.value && exec.value.tasks) {
        exec.value.tasks.forEach((task: any) => {
          taskPerformance.push({
            type: task.type,
            actualTime: task.executionTime,
            success: task.status === 'completed'
          });
        });
      }
    });
    
    return taskPerformance;
  }

  /**
   * Get failure rate for task type
   */
  private getFailureRate(taskType: string, insights: any[]): number {
    const tasksOfType = insights.filter(i => i.type === taskType);
    if (tasksOfType.length === 0) return 0;
    
    const failures = tasksOfType.filter(t => !t.success).length;
    return failures / tasksOfType.length;
  }

  /**
   * Update progress display
   */
  private updateProgress(): void {
    const tasks = this.toDoManager.getAllTasks();
    ui.showTaskList(tasks);
  }

  /**
   * Get agent-specific prompt
   */
  private getAgentPrompt(agent: string): string {
    const promptPath = path.join(__dirname, '..', 'templates', 'prompts', 'modes', `${agent}.md`);
    if (fs.existsSync(promptPath)) {
      return fs.readFileSync(promptPath, 'utf-8');
    }
    
    // Default prompt
    return `You are a ${agent} agent. Complete the given task efficiently and effectively.`;
  }

  /**
   * Recover from critical error
   */
  private async recoverFromError(error: Error): Promise<void> {
    ui.section('Error Recovery');
    ui.error(`Critical error: ${error.message}`);
    
    // Save error context
    this.memory.set(`error_${Date.now()}`, {
      objective: this.context.objective,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Attempt recovery strategies
    ui.info('Attempting recovery strategies...');
    
    // Strategy 1: Simplify objective
    const simplified = await this.simplifyObjective(this.context.objective);
    if (simplified) {
      ui.info('Retrying with simplified objective');
      await this.execute(simplified);
    }
  }

  /**
   * Simplify objective for retry
   */
  private async simplifyObjective(objective: string): Promise<string | null> {
    const prompt = `
The following objective failed to execute:
${objective}

Suggest a simpler version that achieves the core goal.
Return only the simplified objective text, or null if it cannot be simplified.
`;

    try {
      const result = await this.executor.run({
        task: prompt,
        systemPrompt: 'You are an expert at simplifying complex tasks.',
        apiKey: this.apiKey
      });
      
      if (result.success && result.output !== 'null') {
        return result.output.trim();
      }
    } catch (e) {
      // Simplification failed
    }
    
    return null;
  }

  /**
   * Enable or disable parallel execution
   */
  public setParallelExecution(enabled: boolean): void {
    this.parallelExecutionEnabled = enabled;
    this.orchestrator.setParallelMode(enabled);
    
    if (enabled && !this.parallelExecutor) {
      this.parallelExecutor = new ParallelExecutor({
        maxWorkers: this.maxParallelWorkers,
        enableMonitoring: true,
        taskTimeout: 600000
      });
    }
  }

  /**
   * Set maximum parallel workers
   */
  public setMaxParallelWorkers(max: number): void {
    this.maxParallelWorkers = max;
    
    if (this.parallelExecutor) {
      this.parallelExecutor = new ParallelExecutor({
        maxWorkers: max,
        enableMonitoring: true,
        taskTimeout: 600000
      });
    }
  }
}