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
      .command(
        'run <mode> <prompt>',
        'Run a SPARC mode',
        (yargs) =>
          yargs
            .positional('mode', {
              describe: 'The SPARC mode to run',
              type: 'string',
            })
            .positional('prompt', {
              describe: 'The prompt for the SPARC mode',
              type: 'string',
            })
            .option('output', {
              alias: 'o',
              describe: 'Path to save the output file',
              type: 'string',
            }),
        async (argv) => {
          const { mode, prompt, output } = argv;
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
            let agentOutput = result.output;
            try {
              // Try to parse the output to get the actual content
              const parsedOutput = JSON.parse(agentOutput);
              if (parsedOutput.content) {
                agentOutput = parsedOutput.content;
              }
            } catch (e) {
              // Ignore if it's not valid JSON
            }

            if (output) {
              try {
                fs.writeFileSync(output, agentOutput);
                Logger.success('[SPARC]', `Output successfully saved to ${output}`);
              } catch (e) {
                Logger.error('[SPARC]', `Failed to save output to ${output}: ${(e as Error).message}`);
              }
            } else {
              Logger.log('[SPARC]', `Execution successful. Output:\n${agentOutput}`);
            }
          } else {
            Logger.error('[SPARC]', `Execution failed: ${result.error}`);
          }
        }
      )
      .command('modes', 'List all available SPARC modes', {}, () => {
        const modesDir = path.join(process.cwd(), '.gemini', 'prompts', 'modes');
        if (!fs.existsSync(modesDir)) {
          Logger.error('[SPARC]', 'Modes directory not found.');
          return;
        }
        const modes = fs.readdirSync(modesDir).map((file) => file.replace('.md', ''));
        Logger.log('[SPARC]', 'Available modes:');
        console.log(modes.join('\n'));
      }),
  handler: () => {},
};