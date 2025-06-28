import { Agent } from './Agent';
import { Executor } from './executor';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { getTools, Tool } from './tools';
import { Logger } from './Logger';
import { ToDoManager, ToDoItem } from './ToDoManager';

export class Orchestrator {
  private agents: { [name: string]: { mode: string } } = {};
  private executor = new Executor();
  private apiKey: string;
  private rl: readline.Interface;
  private toDoManager: ToDoManager;
  private tools: { [name: string]: Tool };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.toDoManager = new ToDoManager();
    this.tools = getTools(this.toDoManager);
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
    // Initial task for the planner
    this.toDoManager.addTask(initialPrompt, initialAgent);

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
        .map(depId => this.toDoManager.getAllTasks().find(t => t.id === depId))
        .filter((t): t is ToDoItem => !!t);
      
      const taskWithContext = this.buildTaskWithContext(currentTask.task, dependencies);
      const systemPrompt = this.getSystemPrompt(agent.mode);

      Logger.log(`[Agent: ${agentName}]`, `Starting task #${currentTask.id}: ${currentTask.task}`);
      const executionResult = await this.executor.run({
        task: taskWithContext,
        systemPrompt,
        apiKey: this.apiKey,
      });

      if (!executionResult.success || executionResult.error) {
        Logger.error(`[Agent: ${agentName}]`, `Task failed: ${executionResult.error}`);
        this.toDoManager.updateTaskStatus(currentTask.id, 'failed', executionResult.error);
        nextTask = this.toDoManager.getNextTask();
        continue;
      }

      Logger.log(`[Agent: ${agentName}]`, `Raw output:\n---\n${executionResult.output}\n---`);

      try {
        const result = JSON.parse(executionResult.output);
        if (result.tool) {
          await this.executeTool(result.tool, result.args, agentName);
        } else {
            // If the agent doesn't use a tool, we assume it has completed the task
            // and the content is the result.
            this.toDoManager.updateTaskStatus(currentTask.id, 'completed', result.content);
            Logger.success(`[Agent: ${agentName}]`, `Completed task #${currentTask.id}.`);
        }
      } catch (e) {
        Logger.warn(`[Agent: ${agentName}]`, `Output was not valid JSON. Treating as raw text and marking task as completed.`);
        this.toDoManager.updateTaskStatus(currentTask.id, 'completed', executionResult.output);
      }

      nextTask = this.toDoManager.getNextTask();
    }

    Logger.success('[Orchestrator]', 'All tasks have been completed.');
    this.rl.close();
  }
}
