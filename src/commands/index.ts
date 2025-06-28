import { sparcCommand } from './sparc';
import { initCommand } from './init';
import { memoryCommand } from './memory';
import { startCommand } from './start';
import { swarmCommand } from './swarm';

export const commands = [
  initCommand,
  sparcCommand,
  swarmCommand,
  startCommand,
  memoryCommand,
];
