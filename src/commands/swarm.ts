

import { Command } from 'commander';
import { Orchestrator } from '../core/Orchestrator';
import * as dotenv from 'dotenv';
import { Logger } from '../core/Logger';
import { Executor } from '../core/executor';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

export const swarmCommand = () => {
  const command = new Command('swarm')
    .description('Run a swarm of agents to achieve a high-level goal')
    .argument('<goal>', 'The high-level goal for the swarm')
    .action(async (goal) => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        Logger.error('[Swarm]', 'GEMINI_API_KEY not found in .env file.');
        return;
      }

      Logger.log('[Swarm]', `Goal received: "${goal}"`);

      const orchestrator = new Orchestrator(apiKey);
      const executor = new Executor();

      // Define all possible agents in the swarm
      const agents = [
        'swarm-coordinator', 'requirements_gatherer', 'architect', 'coder', 
        'data_provider', 'backtester', 'reviewer', 'risk_manager', 'documenter'
      ];
      for (const agent of agents) {
        orchestrator.addAgent(agent, agent);
      }

      // Step 1: Use a swarm-coordinator to generate a plan (a list of to-do items)
      Logger.log('[Swarm]', 'Initializing swarm-coordinator to generate a plan...');
      const coordinatorPrompt = `Based on the following goal, create a detailed plan as a series of tasks. For each task, specify the most appropriate agent to perform it. The available agents are: ${agents.join(', ')}. The goal is: "${goal}"`;
      
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
        const plan = JSON.parse(planResult.output);
        Logger.success('[Swarm]', 'Plan generated successfully:');
        console.log(JSON.stringify(plan, null, 2));

        // Step 2: Add the generated plan to the to-do list
        for (const task of plan) {
          orchestrator.addAgent(task.agent, task.agent); // Ensure agent is added
          // The initial prompt for the orchestrator will now be the plan itself
        }
        
        // Step 3: Execute the plan
        Logger.log('[Swarm]', 'Executing the generated plan...');
        await orchestrator.run(`The plan has been generated. Please execute the tasks in the to-do list. The first task is for the ${plan[0].agent}.`);

      } catch (e) {
        Logger.error('[Swarm]', `Failed to parse the generated plan. Raw output:
${planResult.output}`);
      }
    });

  return command;
};

