import { CommandModule } from 'yargs';
import { Orchestrator } from '../core/Orchestrator';
import * as dotenv from 'dotenv';
import { Logger } from '../core/Logger';
import { Executor } from '../core/executor';
import * as fs from 'fs';
import * as path from 'path';
import { ToDoManager } from '../core/ToDoManager';

dotenv.config();

export const swarmCommand: CommandModule = {
  command: 'swarm <goal>',
  describe: 'Run a swarm of agents to achieve a high-level goal',
  builder: (yargs) =>
    yargs.positional('goal', {
      describe: 'The high-level goal for the swarm',
      type: 'string',
    }),
  handler: async (argv) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      Logger.error('[Swarm]', 'GEMINI_API_KEY not found in .env file.');
      return;
    }

    Logger.log('[Swarm]', `Goal received: "${argv.goal}"`);

    const toDoManager = new ToDoManager();
    toDoManager.clear(); // Start with a clean slate

    const orchestrator = new Orchestrator(apiKey, toDoManager);
    const executor = new Executor();

    // Define all possible agents in the swarm
    const agents = [
      'swarm-coordinator', 'requirements_gatherer', 'architect', 'coder',
      'data_provider', 'backtester', 'reviewer', 'risk_manager', 'documenter'
    ];
    for (const agent of agents) {
      orchestrator.addAgent(agent, agent);
    }

    // Step 1: Use a swarm-coordinator to generate a plan
    Logger.log('[Swarm]', 'Initializing swarm-coordinator to generate a plan...');
    const coordinatorPrompt = `Based on the following goal, create a detailed plan as a series of tasks. For each task, specify the most appropriate agent to perform it. The available agents are: ${agents.join(', ')}. The goal is: "${argv.goal}"`;

    const systemPromptPath = path.join(__dirname, '..', 'templates', 'prompts', 'modes', `swarm-coordinator.md`);
    const systemPrompt = fs.readFileSync(systemPromptPath, 'utf-8');

    const planResult = await executor.run({
      task: coordinatorPrompt,
      systemPrompt,
      apiKey,
    });

    if (!planResult.success || planResult.error) {
      Logger.error('[Swarm]', `Failed to generate a plan: ${planResult.error}`);
      return;
    }

    try {
      const rawOutput = planResult.output;
      
      // Find the first '{' and the last '}' to isolate the main JSON object.
      const firstBrace = rawOutput.indexOf('{');
      const lastBrace = rawOutput.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
        throw new Error("Could not find a valid JSON object in the executor's output.");
      }
      const jsonShellString = rawOutput.substring(firstBrace, lastBrace + 1);
      
      // First, parse the outer JSON shell from the executor
      const executorResponse = JSON.parse(jsonShellString);
      const agentContent = executorResponse.content;

      let planJsonString: string | null = null;

      // Now, find the JSON plan within the agent's content
      const markdownMatch = agentContent.match(/```(json)?\s*([\s\S]+?)\s*```/);
      if (markdownMatch && markdownMatch[2]) {
        planJsonString = markdownMatch[2];
      } else {
        const firstBracket = agentContent.indexOf('[');
        const lastBracket = agentContent.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket > firstBracket) {
          planJsonString = agentContent.substring(firstBracket, lastBracket + 1);
        }
      }

      if (!planJsonString) {
        throw new Error("Could not find a valid JSON plan in the agent's output.");
      }

      const plan = JSON.parse(planJsonString);

      Logger.success('[Swarm]', 'Plan generated successfully.');

      // Step 2: Add the generated plan to the to-do list
      Logger.log('[Swarm]', 'Adding generated plan to the to-do list...');
      for (const task of plan) {
        toDoManager.addTask(task.task, task.agent, task.dependencies);
      }

      // Step 3: Execute the plan
      Logger.log('[Swarm]', 'Starting orchestrator to execute the plan...');
      await orchestrator.processQueue();

    } catch (e) {
      Logger.error('[Swarm]', `Failed to parse the generated plan. Error: ${(e as Error).message}. Raw output:\n${planResult.output}`);
    }
  },
};