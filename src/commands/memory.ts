import { CommandModule } from 'yargs';
import { Memory } from '../core/Memory';
import { Logger } from '../core/Logger';

export const memoryCommand: CommandModule = {
  command: 'memory <command>',
  describe: 'Manage the memory of the Gemini Flow system',
  builder: (yargs) =>
    yargs
      .command('set <key> <value>', 'Set a value in the memory', {}, (argv) => {
        const memory = new Memory();
        memory.set(argv.key as string, argv.value as string);
        Logger.log('[Memory]', `Set '${argv.key}' to '${argv.value}'`);
      })
      .command('get <key>', 'Get a value from the memory', {}, (argv) => {
        const memory = new Memory();
        const value = memory.get(argv.key as string);
        if (value !== undefined) {
          console.log(value); // Direct output is desired here
        } else {
          Logger.warn('[Memory]', `Key '${argv.key}' not found in memory.`);
        }
      })
      .command('list', 'List all keys in the memory', {}, () => {
        const memory = new Memory();
        const allMemory = memory.getAll();
        console.log(Object.keys(allMemory)); // Direct output is desired here
      }),
  handler: () => {},
};
