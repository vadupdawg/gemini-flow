import { initCommand } from './init';
import { flowCommand } from './flow';
import { swarmCommand } from './swarm';
import { startCommand } from './start';
import { memoryCommand } from './memory';
import { sparcCommand } from './sparc';
import { agentCommand } from './agent';
import { batchtoolCommand } from './batchtool';
import { taskCommand } from './task';
import { chatCommand } from './chat';

export const commands = [
  initCommand,
  flowCommand,
  swarmCommand,
  startCommand,
  memoryCommand,
  sparcCommand,
  agentCommand,
  batchtoolCommand,
  taskCommand,
  chatCommand,
];
