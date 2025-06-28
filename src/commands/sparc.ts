import { CommandModule } from 'yargs';
import { Logger } from '../core/Logger';
import { Executor } from '../core/executor';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export const sparcCommand: CommandModule = {
  command: 'sparc <command>',
  describe: 'Run a SPARC command',
  builder: (yargs) =>
    yargs
      .command('run <mode> <prompt>', 'Run a SPARC mode', {}, async (argv) => {
        const { mode, prompt } = argv;
        Logger.log('[SPARC]', `Running mode '${mode}' with prompt: '${prompt}'`);

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          Logger.error('[SPARC]', 'GEMINI_API_KEY not found in .env file.');
          return;
        }

        const systemPromptPath = path.join(process.cwd(), '.gemini', 'prompts', 'modes', `${mode}.md`);

        if (!fs.existsSync(systemPromptPath)) {
          Logger.error('[SPARC]', `Mode '${mode}' not found at ${systemPromptPath}`);
          return;
        }

        const systemPrompt = fs.readFileSync(systemPromptPath, 'utf-8');

        const executor = new Executor();
        const result = await executor.run({
          task: prompt as string,
          systemPrompt,
          apiKey,
        });

        if (result.success) {
          Logger.log('[SPARC]', `Execution successful. Output:\n${result.output}`);
        } else {
          Logger.error('[SPARC]', `Execution failed: ${result.error}`);
        }
      })
      .command('modes', 'List all available SPARC modes', {}, () => {
        const modesDir = path.join(process.cwd(), '.gemini', 'prompts', 'modes');
        if (!fs.existsSync(modesDir)) {
          Logger.error('[SPARC]', 'Modes directory not found.');
          return;
        }
        const modes = fs.readdirSync(modesDir).map(file => file.replace('.md', ''));
        Logger.log('[SPARC]', 'Available modes:');
        console.log(modes.join('\n'));
      }),
  handler: () => {},
};