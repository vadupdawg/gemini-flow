"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
const flow_1 = require("./flow");
const init_1 = require("./init");
const memory_1 = require("./memory");
const start_1 = require("./start");
const swarm_1 = require("./swarm");
exports.commands = [
    init_1.initCommand,
    flow_1.flowCommand,
    swarm_1.swarmCommand,
    start_1.startCommand,
    memory_1.memoryCommand,
];
