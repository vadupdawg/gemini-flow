#!/usr/bin/env node

import { Command } from 'commander';
import { commands } from './commands';

const program = new Command();

program
  .name('gemini-flow')
  .description('A multi-agent orchestration system for Gemini models.')
  .version('0.0.1');

// Register all commands
for (const command of commands) {
    program.addCommand(command());
}

program.parse(process.argv);
