#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init';
import { sparcCommand } from './commands/sparc';
import { startCommand } from './commands/start';
import { memoryCommand } from './commands/memory';
import { swarmCommand } from './commands/swarm';

const program = new Command();

program
  .version('1.0.0')
  .description('Gemini Flow: AI Agent Orchestration Platform');

program.addCommand(initCommand());
program.addCommand(sparcCommand());
program.addCommand(startCommand());
program.addCommand(memoryCommand());
program.addCommand(swarmCommand());

program.parse(process.argv);