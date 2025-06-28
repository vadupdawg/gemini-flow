import { CommandModule } from 'yargs';
import * as readline from 'readline';
import { Logger } from '../core/Logger';
import yargs, { Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { commands } from './index';

export const chatCommand: CommandModule = {
  command: 'chat',
  describe: 'Start an interactive chat session',
  handler: () => {
    Logger.log('[Chat]', 'Starting interactive session. Type "exit" to end.');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'gemini-flow> ',
    });

    const cli = yargs(hideBin(process.argv))
      .command(commands)
      .demandCommand(1, '')
      .help(false) // Disable default help to handle it manually
      .fail((msg: string, err: Error) => {
        if (err) throw err; // Propagate errors
        Logger.error('[Chat]', msg);
        rl.prompt();
      });

    rl.prompt();

    rl.on('line', (line) => {
      const input = line.trim();
      if (input.toLowerCase() === 'exit') {
        rl.close();
        return;
      }

      if (input) {
        // Manually parse the line
        cli.parse(input, (err: Error | undefined, argv: any, output: string) => {
          if (output) {
            console.log(output);
          }
          rl.prompt();
        });
      } else {
        rl.prompt();
      }
    }).on('close', () => {
      Logger.log('[Chat]', 'Exiting interactive session.');
      process.exit(0);
    });
  },
};