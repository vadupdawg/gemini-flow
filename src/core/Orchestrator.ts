import { Agent } from './Agent';
import { Executor } from './executor';
import { ParallelExecutor, ParallelTask } from './ParallelExecutor';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { getTools, Tool } from './tools';
import { Logger } from './Logger';
import { ui } from './UI';
import { ToDoManager, ToDoItem } from './ToDoManager';
import { InteractiveMode } from './InteractiveMode';

export class Orchestrator {
  private agents: { [name: string]: { mode: string } } = {};
  private executor = new Executor();
  private parallelExecutor?: ParallelExecutor;
  private apiKey: string;
  private rl: readline.Interface;
  private toDoManager: ToDoManager;
  private tools: { [name: string]: Tool };
  private parallelMode: boolean = false;
  private maxParallelTasks: number = 4;

  constructor(apiKey: string, toDoManager?: ToDoManager, parallelMode: boolean = false) {
    this.apiKey = apiKey;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.toDoManager = toDoManager || new ToDoManager();
    this.tools = getTools(this.toDoManager);
    this.parallelMode = parallelMode;
    
    if (parallelMode) {
      this.parallelExecutor = new ParallelExecutor({
        maxWorkers: this.maxParallelTasks,
        enableMonitoring: true
      });
    }
  }

  private async confirmExecution(command: string): Promise<boolean> {
    return new Promise((resolve) => {
      const prompt = Logger.security('[SECURITY]', command, 'Do you want to allow this? (y/n): ');
      this.rl.question(prompt, (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  addAgent(name: string, mode: string) {
    if (!this.agents[name]) {
      this.agents[name] = { mode };
    }
  }

  getAgent(name: string): { mode: string } | undefined {
    return this.agents[name];
  }

  private getSystemPrompt(mode: string): string {
    const userPromptPath = path.join(process.cwd(), '.gemini', 'prompts', 'modes', `${mode}.md`);
    if (fs.existsSync(userPromptPath)) {
      return fs.readFileSync(userPromptPath, 'utf-8');
    }

    const templatePath = path.join(__dirname, '..', 'templates', 'prompts', 'modes', `${mode}.md`);
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, 'utf-8');
    }

    Logger.warn(`[Orchestrator]`, `System prompt for mode '${mode}' not found. Using a default.`);
    return `You are a helpful assistant with the role: ${mode}.`;
  }

  private buildTaskWithContext(task: string, dependencies: ToDoItem[]): string {
    let context = '';
    if (dependencies.length > 0) {
      const contextData = dependencies.map(dep => ({
        task: dep.task,
        result: dep.result,
      }));
      context = `\n\n## Context from Completed Tasks\n\n${JSON.stringify(contextData, null, 2)}`;
    }
    return `${task}${context}`;
  }

  private async executeTool(toolName: string, args: any, agentName: string): Promise<any> {
    const tool = this.tools[toolName];
    if (!tool) {
      Logger.error(`[Agent: ${agentName}]`, `Unknown tool '${toolName}'`);
      return { success: false, error: `Unknown tool '${toolName}'` };
    }

    if (tool.name === 'runShellCommand') {
      const allowed = await this.confirmExecution(args.command);
      if (!allowed) {
        Logger.warn(`[Orchestrator]`, `Execution of command denied by user.`);
        return { success: false, error: 'Execution denied by user' };
      }
    }

    const result = await tool.execute(args);
    if (result.success) {
      Logger.success(`[Agent: ${agentName}]`, `Used tool '${toolName}'.`);
    } else {
      Logger.error(`[Agent: ${agentName}]`, `Tool '${toolName}' failed: ${result.error}`);
    }
    return result;
  }

  async run(initialPrompt: string, initialAgent: string = 'coder') {
    this.toDoManager.addTask(initialPrompt, initialAgent);
    
    if (this.parallelMode) {
      await this.processQueueParallel();
    } else {
      await this.processQueueSequential();
    }
  }

  async processQueueSequential() {
    // Show initial task overview
    const allTasks = this.toDoManager.getAllTasks();
    if (allTasks.length > 0) {
      ui.showTaskList(allTasks);
    }
    
    let nextTask = this.toDoManager.getNextTask();
    while (nextTask) {
      const currentTask = nextTask;
      this.toDoManager.updateTaskStatus(currentTask.id, 'in_progress');

      const agentName = currentTask.agent;
      const agent = this.getAgent(agentName);
      if (!agent) {
        Logger.error(`[Orchestrator]`, `Agent ${agentName} not found.`);
        this.toDoManager.updateTaskStatus(currentTask.id, 'failed', 'Agent not found');
        nextTask = this.toDoManager.getNextTask();
        continue;
      }

      const dependencies = currentTask.dependencies
        .map(depId => this.toDoManager.getTaskById(depId))
        .filter((t): t is ToDoItem => !!t);
      
      const taskWithContext = this.buildTaskWithContext(currentTask.task, dependencies);
      const systemPrompt = this.getSystemPrompt(agent.mode);

      // Start agent spinner
      ui.agentStart(agentName, `Task #${currentTask.id}: ${currentTask.task}`);
      
      const executionResult = await this.executor.run({
        task: taskWithContext,
        systemPrompt,
        apiKey: this.apiKey,
      });

      if (!executionResult.success || executionResult.error) {
        ui.agentError(agentName, `Task failed: ${executionResult.error}`);
        this.toDoManager.updateTaskStatus(currentTask.id, 'failed', executionResult.error);
        nextTask = this.toDoManager.getNextTask();
        continue;
      }

      try {
        const result = JSON.parse(executionResult.output);
        if (result.tool) {
          ui.agentInfo(agentName, `Using tool: ${result.tool}`);
          await this.executeTool(result.tool, result.args, agentName);
        } else {
            this.toDoManager.updateTaskStatus(currentTask.id, 'completed', result.content);
            ui.agentSuccess(agentName, `Completed task #${currentTask.id}`);
        }
      } catch (e) {
        // Try to extract meaningful content from non-JSON response
        const cleanOutput = executionResult.output.substring(0, 100).replace(/\n/g, ' ').trim();
        ui.agentSuccess(agentName, `Completed task #${currentTask.id}`);
        this.toDoManager.updateTaskStatus(currentTask.id, 'completed', executionResult.output);
      }

      nextTask = this.toDoManager.getNextTask();
    }

    ui.success('All tasks have been completed! 🎉');
    ui.cleanup();
    
    // Only close rl if not in interactive mode
    if (!InteractiveMode.isActive()) {
      this.rl.close();
    }
  }

  /**
   * Process tasks in parallel mode
   */
  async processQueueParallel() {
    // Show initial task overview
    const allTasks = this.toDoManager.getAllTasks();
    if (allTasks.length > 0) {
      ui.showTaskList(allTasks);
    }
    
    // Start parallel executor
    if (!this.parallelExecutor) {
      throw new Error('Parallel executor not initialized');
    }
    this.parallelExecutor.start();
    
    // Get all pending tasks
    const pendingTasks = allTasks.filter(task => task.status === 'pending');
    
    // Convert tasks to parallel tasks
    const parallelTasks: ParallelTask[] = pendingTasks.map(task => ({
      id: task.id.toString(),
      type: 'gemini',
      priority: this.getTaskPriority(task),
      dependencies: task.dependencies.map(d => d.toString()),
      data: {
        apiKey: this.apiKey,
        prompt: this.buildTaskWithContext(task.task, this.getTaskDependencies(task)),
        systemPrompt: this.getSystemPrompt(this.agents[task.agent]?.mode || 'coder'),
        agent: task.agent,
        taskData: task
      }
    }));
    
    // Submit all tasks
    for (const pTask of parallelTasks) {
      this.toDoManager.updateTaskStatus(parseInt(pTask.id), 'in_progress');
      
      try {
        const result = await this.parallelExecutor!.submitTask(pTask);
        await this.handleParallelTaskResult(pTask, result);
      } catch (error) {
        ui.agentError(pTask.data.agent, `Task failed: ${(error as Error).message}`);
        this.toDoManager.updateTaskStatus(parseInt(pTask.id), 'failed', (error as Error).message);
      }
    }
    
    // Wait for all tasks to complete
    await this.parallelExecutor!.waitForCompletion();
    
    ui.success('All tasks have been completed! 🎉');
    ui.cleanup();
    
    // Stop parallel executor
    await this.parallelExecutor!.stop();
    
    // Only close rl if not in interactive mode
    if (!InteractiveMode.isActive()) {
      this.rl.close();
    }
  }

  /**
   * Get task priority based on dependencies and type
   */
  private getTaskPriority(task: ToDoItem): number {
    // Tasks with no dependencies have highest priority
    if (task.dependencies.length === 0) return 10;
    
    // Tasks with fewer dependencies have higher priority
    return Math.max(1, 10 - task.dependencies.length);
  }

  /**
   * Get task dependencies as ToDoItems
   */
  private getTaskDependencies(task: ToDoItem): ToDoItem[] {
    return task.dependencies
      .map(depId => this.toDoManager.getTaskById(depId))
      .filter((t): t is ToDoItem => !!t);
  }

  /**
   * Handle result from parallel task execution
   */
  private async handleParallelTaskResult(task: ParallelTask, result: any): Promise<void> {
    const taskId = parseInt(task.id);
    const agentName = task.data.agent;
    
    try {
      const parsedResult = JSON.parse(result);
      if (parsedResult.tool) {
        ui.agentInfo(agentName, `Using tool: ${parsedResult.tool}`);
        await this.executeTool(parsedResult.tool, parsedResult.args, agentName);
      } else {
        this.toDoManager.updateTaskStatus(taskId, 'completed', parsedResult.content);
        ui.agentSuccess(agentName, `Completed task #${taskId}`);
      }
    } catch (e) {
      // Try to extract meaningful content from non-JSON response
      ui.agentSuccess(agentName, `Completed task #${taskId}`);
      this.toDoManager.updateTaskStatus(taskId, 'completed', result);
    }
  }

  /**
   * Enable or disable parallel mode
   */
  public setParallelMode(enabled: boolean): void {
    this.parallelMode = enabled;
    
    if (enabled && !this.parallelExecutor) {
      this.parallelExecutor = new ParallelExecutor({
        maxWorkers: this.maxParallelTasks,
        enableMonitoring: true
      });
    }
    
    if (this.parallelExecutor) {
      this.parallelExecutor.setParallelMode(enabled);
    }
  }

  /**
   * Set maximum parallel tasks
   */
  public setMaxParallelTasks(max: number): void {
    this.maxParallelTasks = max;
    
    if (this.parallelExecutor) {
      this.parallelExecutor = new ParallelExecutor({
        maxWorkers: max,
        enableMonitoring: true
      });
    }
  }
}
