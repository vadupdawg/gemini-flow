import { CommandModule } from 'yargs';
import { Logger } from '../core/Logger';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export const batchtoolCommand: CommandModule = {
  command: 'batchtool <command>',
  describe: 'Run a batch of commands',
  builder: (yargs) =>
    yargs.command(
      'run [commands..]',
      'Run a series of commands',
      (yargs) =>
        yargs
          .positional('commands', {
            describe: 'The commands to run',
            type: 'string',
            array: true,
          })
          .option('parallel', {
            alias: 'p',
            type: 'boolean',
            description: 'Run commands in parallel',
            default: false,
          }),
      async (argv) => {
        const { commands, parallel } = argv;

        if (!commands || commands.length === 0) {
          Logger.error('[BatchTool]', 'No commands provided.');
          return;
        }

        Logger.log('[BatchTool]', `Executing ${commands.length} commands...`);

        const executeCommand = async (cmd: string) => {
          try {
            Logger.log('[BatchTool]', `Running: ${cmd}`);
            const { stdout, stderr } = await execPromise(cmd);
            if (stderr) {
              Logger.warn(`[BatchTool][stderr][${cmd}]`, stderr);
            }
            Logger.log(`[BatchTool][stdout][${cmd}]`, stdout);
          } catch (error) {
            Logger.error(`[BatchTool][error][${cmd}]`, (error as Error).message);
          }
        };

        if (parallel) {
          Logger.log('[BatchTool]', 'Running in parallel mode.');
          await Promise.all((commands as string[]).map(executeCommand));
        } else {
          Logger.log('[BatchTool]', 'Running in sequential mode.');
          for (const cmd of commands as string[]) {
            await executeCommand(cmd);
          }
        }

        Logger.success('[BatchTool]', 'All commands executed.');
      }
    ),
  handler: () => {},
};
