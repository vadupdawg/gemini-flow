import { Command } from 'commander';
import { Orchestrator } from '../core/Orchestrator';
import * as dotenv from 'dotenv';

dotenv.config();

export const flowCommand = () => {
  const command = new Command('flow')
    .description('Run a dynamic, to-do based workflow')
    .argument('<initialPrompt>', 'The initial prompt to start the flow')
    .action(async (initialPrompt) => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error('GEMINI_API_KEY not found in .env file.');
        return;
      }

      const orchestrator = new Orchestrator(apiKey);

      // Add a default agent for now
      orchestrator.addAgent('coder', 'coder');

      // Run the dynamic workflow
      await orchestrator.run(initialPrompt);
    });

  return command;
};
