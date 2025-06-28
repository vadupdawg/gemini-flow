"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryCommand = void 0;
const commander_1 = require("commander");
const Memory_1 = require("../core/Memory");
const Logger_1 = require("../core/Logger");
const memoryCommand = () => {
    const command = new commander_1.Command('memory')
        .description('Manage the memory of the Gemini Flow system');
    command
        .command('set <key> <value>')
        .description('Set a value in the memory')
        .action((key, value) => {
        const memory = new Memory_1.Memory();
        memory.set(key, value);
        Logger_1.Logger.log('[Memory]', `Set '${key}' to '${value}'`);
    });
    command
        .command('get <key>')
        .description('Get a value from the memory')
        .action((key) => {
        const memory = new Memory_1.Memory();
        const value = memory.get(key);
        if (value !== undefined) {
            console.log(value); // Direct output is desired here
        }
        else {
            Logger_1.Logger.warn('[Memory]', `Key '${key}' not found in memory.`);
        }
    });
    command
        .command('list')
        .description('List all keys in the memory')
        .action(() => {
        const memory = new Memory_1.Memory();
        const allMemory = memory.getAll();
        console.log(Object.keys(allMemory)); // Direct output is desired here
    });
    return command;
};
exports.memoryCommand = memoryCommand;
