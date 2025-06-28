import { CommandModule } from 'yargs';
import { Logger } from '../core/Logger';
import { AgentManager } from '../core/AgentManager';

const agentManager = new AgentManager();

export const agentCommand: CommandModule = {
  command: 'agent <command>',
  describe: 'Manage AI agents',
  builder: (yargs) =>
    yargs
      .command('spawn <mode>', 'Spawn a new agent', {
        name: {
            alias: 'n',
            describe: 'Name of the agent',
            type: 'string',
            demandOption: true,
        }
      }, (argv) => {
        const agent = agentManager.spawn(argv.name, argv.mode as string);
        console.log(agent);
      })
      .command('info <id>', 'Get information about an agent', {}, (argv) => {
        const agent = agentManager.get(argv.id as string);
        if (agent) {
          console.log(agent);
        } else {
          Logger.error('[Agent]', `Agent with id '${argv.id}' not found.`);
        }
      })
      .command('list', 'List all agents', {}, () => {
        const agents = agentManager.list();
        console.log(agents);
      })
      .command('terminate <id>', 'Terminate an agent', {}, (argv) => {
        const success = agentManager.terminate(argv.id as string);
        if (!success) {
          Logger.error('[Agent]', `Agent with id '${argv.id}' not found.`);
        }
      }),
  handler: () => {},
};
