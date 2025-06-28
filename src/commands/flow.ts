import { CommandModule } from 'yargs';
import { Orchestrator } from '../core/Orchestrator';
import * as dotenv from 'dotenv';

dotenv.config();

export const flowCommand: CommandModule = {
  command: 'flow <initialPrompt>',
  describe: 'Run a dynamic, to-do based workflow',
  builder: (yargs) =>
    yargs.positional('initialPrompt', {
      describe: 'The initial prompt to start the flow',
      type: 'string',
    }),
  handler: async (argv) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in .env file.');
      return;
    }

    const orchestrator = new Orchestrator(apiKey);

    // Add a default agent for now
    orchestrator.addAgent('coder', 'coder');

    // Run the dynamic workflow
    await orchestrator.run(argv.initialPrompt as string);
  },
};