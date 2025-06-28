#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const commands_1 = require("./commands");
const program = new commander_1.Command();
program
    .name('gemini-flow')
    .description('A multi-agent orchestration system for Gemini models.')
    .version('0.0.1');
// Register all commands
for (const command of commands_1.commands) {
    program.addCommand(command());
}
program.parse(process.argv);
