

import { Command } from 'commander';
import { Orchestrator, WorkflowStep } from '../core/Orchestrator';
import { Agent } from '../core/Agent';
import * as dotenv from 'dotenv';
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
        console.error('GEMINI_API_KEY not found in .env file.');
        return;
      }

      console.log(`[Swarm] Goal received: "${goal}"`);
      console.log('[Swarm] Initializing swarm-coordinator to generate a plan...');

      // 1. Generate the plan using the swarm-coordinator
      const coordinator = new Agent('swarm-coordinator', 'swarm-coordination', apiKey);
      const coordinatorPromptPath = path.join(process.cwd(), '.gemini', 'prompts', 'modes', 'swarm-coordinator.md');
      const coordinatorPrompt = fs.readFileSync(coordinatorPromptPath, 'utf-8');

      const planJson = await coordinator.run(goal, coordinatorPrompt);

      let workflow: WorkflowStep[];
      try {
        // The AI's output might have markdown formatting, so we need to extract the JSON
        const jsonMatch = planJson.match(/```json\n([\s\S]*?)\n```/);
        const extractedJson = jsonMatch ? jsonMatch[1] : planJson;
        workflow = JSON.parse(extractedJson);
        console.log('[Swarm] Plan generated successfully:');
        console.log(JSON.stringify(workflow, null, 2));
      } catch (error) {
        console.error('[Swarm] Failed to parse the plan from the swarm-coordinator.');
        console.error('Received output:', planJson);
        return;
      }

      // 2. Execute the generated workflow
      console.log('\n[Swarm] Executing the generated plan...');
      const orchestrator = new Orchestrator(apiKey);
      
      // Dynamically add all required agents to the orchestrator
      const requiredAgents = [...new Set(workflow.map(step => step.agent))];
      for (const agentName of requiredAgents) {
        // We assume the mode is the same as the agent name for simplicity
        orchestrator.addAgent(agentName, agentName);
      }

      await orchestrator.runWorkflow(workflow);

      console.log('\n[Swarm] Workflow finished.');
    });

  return command;
};

