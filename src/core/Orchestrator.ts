import { Agent } from './Agent';
import { Memory } from './Memory';
import { Executor } from './executor';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { tools } from './tools';
import { Logger } from './Logger';

export type MemoryUpdateStrategy = 'overwrite' | 'append' | 'merge';
export type OnErrorStrategy = 'stop' | 'continue';

export interface WorkflowStep {
  agent: string;
  task: string;
  inputKey?: string | string[];
  outputKey?: string;
  memoryUpdateStrategy?: MemoryUpdateStrategy;
  onError?: OnErrorStrategy;
}

export class Orchestrator {
  private agents: { [name: string]: { mode: string } } = {};
  private memory = new Memory();
  private executor = new Executor();
  private apiKey: string;
  private rl: readline.Interface;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
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

  private buildTaskWithContext(task: string, inputKeys?: string | string[]): string {
    if (!inputKeys) {
      return task;
    }

    const inputs: { [key: string]: any } = {};
    const keys = Array.isArray(inputKeys) ? inputKeys : [inputKeys];

    for (const key of keys) {
      inputs[key] = this.memory.get(key);
    }

    return `${task}

## Context from Memory

${JSON.stringify(inputs, null, 2)}`;
  }

  async runWorkflow(workflow: WorkflowStep[], parallel = false) {
    const runStep = async (step: WorkflowStep): Promise<boolean> => {
      const agentName = step.agent;
      const agent = this.getAgent(agentName);
      if (!agent) {
        Logger.error(`[Orchestrator]`, `Agent ${agentName} not found.`);
        return false;
      }

      const taskWithContext = this.buildTaskWithContext(step.task, step.inputKey);
      const systemPrompt = this.getSystemPrompt(agent.mode);

      Logger.log(`[Agent: ${agentName}]`, `Starting task...`);
      const executionResult = await this.executor.run({
        task: taskWithContext,
        systemPrompt,
        apiKey: this.apiKey,
      });

      if (!executionResult.success || executionResult.error) {
        Logger.error(`[Agent: ${agentName}]`, `Task failed: ${executionResult.error}`);
        return false;
      }

      Logger.log(`[Agent: ${agentName}]`, `Raw output:
---
${executionResult.output}
---`);

      try {
        const result = JSON.parse(executionResult.output);

        if (result.tool && tools[result.tool]) {
          const tool = tools[result.tool];

          if (tool.name === 'runShellCommand') {
            const allowed = await this.confirmExecution(result.args.command);
            if (!allowed) {
              Logger.warn(`[Orchestrator]`, `Execution of command denied by user. Skipping step.`);
              return true; // Not a failure, just skipped
            }
          }

          const toolResult = await tool.execute(result.args);
          if (!toolResult.success) {
            Logger.error(`[Agent: ${agentName}]`, `Tool '${result.tool}' failed: ${toolResult.error}`);
            return false;
          }

          Logger.success(`[Agent: ${agentName}]`, `Used tool '${result.tool}'.`);
          if (step.outputKey) {
            this.memory.set(step.outputKey, toolResult);
            Logger.log(`[Memory]`, `Saved tool output to key '${step.outputKey}'.`);
          }
          return true;
        }

        if (step.outputKey) {
          if (!result.success) {
            Logger.warn(`[Agent: ${agentName}]`, `Reported failure. Not saving to memory.`);
            return true; // Not a failure, just a reported issue
          }

          const valueToStore = result.content;
          this.memory.set(step.outputKey, valueToStore);
          Logger.log(`[Memory]`, `Saved output to key '${step.outputKey}'.`);
        } else if (result.success && result.content) {
          Logger.log(`[Agent: ${agentName}]`, `Result: ${result.content}`);
        }
      } catch (e) {
        Logger.warn(`[Agent: ${agentName}]`, `Output was not valid JSON. Treating as raw text.`);
        if (step.outputKey) {
          this.memory.set(step.outputKey, executionResult.output);
          Logger.log(`[Memory]`, `Saved raw output to key '${step.outputKey}'.`);
        } else {
          console.log(executionResult.output);
        }
      }
      return true;
    };

    if (parallel) {
      await Promise.all(workflow.map(runStep));
    } else {
      for (const step of workflow) {
        const success = await runStep(step);
        if (!success) {
          const onError = step.onError || 'stop';
          if (onError === 'stop') {
            Logger.error('[Orchestrator]', 'Workflow stopped due to a critical error.');
            break;
          } else {
            Logger.warn('[Orchestrator]', 'Step failed, but workflow is set to continue.');
          }
        }
      }
    }
    this.rl.close();
  }
}
