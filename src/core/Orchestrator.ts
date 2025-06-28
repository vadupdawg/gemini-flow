
import { Agent } from './Agent';
import { Memory } from './Memory';
import * as fs from 'fs';
import * as path from 'path';

export type MemoryUpdateStrategy = 'overwrite' | 'append' | 'merge';

export interface WorkflowStep {
  agent: string;
  task: string;
  inputKey?: string | string[]; // Allow multiple inputs
  outputKey?: string;
  memoryUpdateStrategy?: MemoryUpdateStrategy;
}

export class Orchestrator {
  private agents: Agent[] = [];
  private memory = new Memory();

  addAgent(agent: Agent) {
    this.agents.push(agent);
  }

  getAgent(name: string): Agent | undefined {
    return this.agents.find(agent => agent.name === name);
  }

  private getSystemPrompt(mode: string): string | undefined {
    const promptPath = path.join(process.cwd(), '.gemini', 'prompts', 'modes', `${mode}.md`);
    if (fs.existsSync(promptPath)) {
      return fs.readFileSync(promptPath, 'utf-8');
    }
    return undefined;
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
      const result = await agent.run(taskWithContext, systemPrompt);

      if (step.outputKey) {
        const strategy = step.memoryUpdateStrategy || 'overwrite';
        const existingValue = this.memory.get(step.outputKey);
        let newValue = result;

        switch (strategy) {
          case 'append':
            newValue = existingValue ? `${existingValue}\n\n---\n\n${result}` : result;
            break;
          case 'merge':
            try {
              const existingJson = existingValue ? JSON.parse(existingValue) : {};
              const newJson = JSON.parse(result);
              newValue = JSON.stringify({ ...existingJson, ...newJson }, null, 2);
            } catch (e) {
              console.error(`[Orchestrator] Merge failed for key '${step.outputKey}'. Defaulting to append.`);
              newValue = existingValue ? `${existingValue}\n\n---\n\n${result}` : result;
            }
            break;
          case 'overwrite':
          default:
            // newValue is already the result
            break;
        }
        
        this.memory.set(step.outputKey, newValue);
        console.log(`[Orchestrator] Agent ${agent.name} saved output to memory key '${step.outputKey}' using strategy '${strategy}'`);
      } else {
        console.log(result);
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
