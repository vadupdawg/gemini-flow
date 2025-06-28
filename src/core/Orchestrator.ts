import { Agent } from './Agent';
import { Memory } from './Memory';
import { Executor } from './executor';
import * as fs from 'fs';
import * as path from 'path';

export type MemoryUpdateStrategy = 'overwrite' | 'append' | 'merge';

export interface WorkflowStep {
  agent: string;
  task: string;
  inputKey?: string | string[];
  outputKey?: string;
  memoryUpdateStrategy?: MemoryUpdateStrategy;
}

export class Orchestrator {
  private agents: { [name: string]: { mode: string } } = {};
  private memory = new Memory();
  private executor = new Executor();
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
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

    console.warn(`[Orchestrator] System prompt for mode '${mode}' not found. Using a default.`);
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

    return `${task}\n\n## Context from Memory\n\n${JSON.stringify(inputs, null, 2)}`;
  }

  async runWorkflow(workflow: WorkflowStep[], parallel = false) {
    const runStep = async (step: WorkflowStep) => {
      const agent = this.getAgent(step.agent);
      if (!agent) {
        console.error(`[Orchestrator] Agent ${step.agent} not found.`);
        return;
      }

      const taskWithContext = this.buildTaskWithContext(step.task, step.inputKey);
      const systemPrompt = this.getSystemPrompt(agent.mode);

      const executionResult = await this.executor.run({
        task: taskWithContext,
        systemPrompt,
        apiKey: this.apiKey,
      });

      if (!executionResult.success) {
        console.error(`[Orchestrator] Task failed for agent ${step.agent}:`, executionResult.error);
        return;
      }
      
      if (executionResult.error) {
        console.error(`[Orchestrator] Error executing task for agent ${step.agent}: ${executionResult.error}`);
        return;
      }

      // DEBUG: Log raw agent output
      console.log(`[Orchestrator] Raw output from agent ${step.agent}:
---
${executionResult.output}
---`);

      try {
        const result = JSON.parse(executionResult.output);

        if (step.outputKey) {
          if (!result.success) {
            console.log(`[Orchestrator] Agent ${step.agent} reported failure. Not saving to memory.`);
            return;
          }

          let valueToStore;
          if (result.type === 'file') {
            valueToStore = `File created at: ${result.path}`;
          } else {
            valueToStore = result.content;
          }

          const strategy = step.memoryUpdateStrategy || 'overwrite';
          const existingValue = this.memory.get(step.outputKey);
          let newValue = valueToStore;

          switch (strategy) {
            case 'append':
              newValue = existingValue ? `${existingValue}

---

${valueToStore}` : valueToStore;
              break;
            case 'merge':
              // Merging doesn't make as much sense with this new structure,
              // but we'll keep a basic version.
              try {
                const existingJson = existingValue ? JSON.parse(existingValue) : {};
                const newJson = JSON.parse(valueToStore);
                newValue = JSON.stringify({ ...existingJson, ...newJson }, null, 2);
              } catch (e) {
                console.error(`[Orchestrator] Merge failed for key '${step.outputKey}'. Defaulting to append.`);
                newValue = existingValue ? `${existingValue}

---

${valueToStore}` : valueToStore;
              }
              break;
            case 'overwrite':
            default:
              break;
          }
          
          this.memory.set(step.outputKey, newValue);
          console.log(`[Orchestrator] Agent ${step.agent} saved output to memory key '${step.outputKey}' using strategy '${strategy}'`);
        } else if (result.success && result.content) {
          console.log(result.content);
        }
      } catch (e) {
        // Handle cases where the output is not JSON (e.g., from older prompts)
        console.log(`[Orchestrator] Agent ${step.agent} output was not valid JSON. Treating as raw text.`);
        if (step.outputKey) {
          this.memory.set(step.outputKey, executionResult.output);
          console.log(`[Orchestrator] Agent ${step.agent} saved raw output to memory key '${step.outputKey}'`);
        } else {
          console.log(executionResult.output);
        }
      }
    };

    if (parallel) {
      await Promise.all(workflow.map(runStep));
    } else {
      for (const step of workflow) {
        await runStep(step);
      }
    }
  }
}