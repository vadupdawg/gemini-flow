import { Command } from 'commander';
import { Orchestrator, WorkflowStep } from '../core/Orchestrator';
import { Agent } from '../core/Agent';
import * as dotenv from 'dotenv';

dotenv.config();

export const sparcCommand = () => {
  const command = new Command('sparc')
    .description('Run a SPARC workflow')
    .option('--parallel', 'Run agents in parallel')
    .action(async (options) => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error('GEMINI_API_KEY not found in .env file.');
        return;
      }

      const orchestrator = new Orchestrator(apiKey);

      // Create agents
      orchestrator.addAgent('architect', 'architect');
      orchestrator.addAgent('coder', 'coder');

      // Define a memory-driven workflow
      const workflow: WorkflowStep[] = [
        {
          agent: 'architect',
          task: 'Design a REST API for a simple e-commerce application. The output should be a JSON object representing the API design.',
          outputKey: 'api_design'
        },
        {
          agent: 'coder',
          task: 'Based on the provided API design, implement the user endpoint in Node.js with Express.',
          inputKey: 'api_design',
          outputKey: 'user_endpoint_code'
        },
      ];

      // Run the workflow
      await orchestrator.runWorkflow(workflow, options.parallel);

      console.log("\nWorkflow finished. Check the memory for the results.");
    });

  return command;
};