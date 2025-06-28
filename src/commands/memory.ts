import { Command } from 'commander';
import { Memory } from '../core/Memory';
import { Logger } from '../core/Logger';

export const memoryCommand = () => {
  const command = new Command('memory')
    .description('Manage the memory of the Gemini Flow system');

  command
    .command('set <key> <value>')
    .description('Set a value in the memory')
    .action((key, value) => {
      const memory = new Memory();
      memory.set(key, value);
      Logger.log('[Memory]', `Set '${key}' to '${value}'`);
    });

  command
    .command('get <key>')
    .description('Get a value from the memory')
    .action((key) => {
      const memory = new Memory();
      const value = memory.get(key);
      if (value !== undefined) {
        console.log(value); // Direct output is desired here
      } else {
        Logger.warn('[Memory]', `Key '${key}' not found in memory.`);
      }
    });

  command
    .command('list')
    .description('List all keys in the memory')
    .action(() => {
      const memory = new Memory();
      const allMemory = memory.getAll();
      console.log(Object.keys(allMemory)); // Direct output is desired here
    });

  return command;
};