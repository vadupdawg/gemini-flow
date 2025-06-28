"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
const init_1 = require("./init");
const flow_1 = require("./flow");
const swarm_1 = require("./swarm");
const start_1 = require("./start");
const memory_1 = require("./memory");
const sparc_1 = require("./sparc");
const agent_1 = require("./agent");
const batchtool_1 = require("./batchtool");
const task_1 = require("./task");
const chat_1 = require("./chat");
exports.commands = [
    init_1.initCommand,
    flow_1.flowCommand,
    swarm_1.swarmCommand,
    start_1.startCommand,
    memory_1.memoryCommand,
    sparc_1.sparcCommand,
    agent_1.agentCommand,
    batchtool_1.batchtoolCommand,
    task_1.taskCommand,
    chat_1.chatCommand,
];
