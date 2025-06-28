#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const init_1 = require("./commands/init");
const sparc_1 = require("./commands/sparc");
const start_1 = require("./commands/start");
const memory_1 = require("./commands/memory");
const swarm_1 = require("./commands/swarm");
const program = new commander_1.Command();
program
    .version('1.0.0')
    .description('Gemini Flow: AI Agent Orchestration Platform');
program.addCommand((0, init_1.initCommand)());
program.addCommand((0, sparc_1.sparcCommand)());
program.addCommand((0, start_1.startCommand)());
program.addCommand((0, memory_1.memoryCommand)());
program.addCommand((0, swarm_1.swarmCommand)());
program.parse(process.argv);
