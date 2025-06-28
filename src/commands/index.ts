import { flowCommand } from './flow';
import { initCommand } from './init';
import { memoryCommand } from './memory';
import { startCommand } from './start';
import { swarmCommand } from './swarm';

export const commands = [
  initCommand,
  flowCommand,
  swarmCommand,
  startCommand,
  memoryCommand,
];
