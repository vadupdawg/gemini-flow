"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryCommand = void 0;
const commander_1 = require("commander");
const Memory_1 = require("../core/Memory");
const memoryCommand = () => {
    const command = new commander_1.Command('memory')
        .description('Manage the memory of the Gemini Flow system');
    const memory = new Memory_1.Memory();
    command
        .command('set <key> <value>')
        .description('Set a value in the memory')
        .action((key, value) => {
        memory.set(key, value);
        console.log(`Set '${key}' to '${value}'`);
    });
    command
        .command('get <key>')
        .description('Get a value from the memory')
        .action((key) => {
        const value = memory.get(key);
        if (value !== undefined) {
            console.log(value);
        }
        else {
            console.log(`Key '${key}' not found in memory.`);
        }
    });
    command
        .command('list')
        .description('List all keys in the memory')
        .action(() => {
        const allMemory = memory.getAll();
        console.log(Object.keys(allMemory));
    });
    return command;
};
exports.memoryCommand = memoryCommand;
