"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryCommand = void 0;
const Memory_1 = require("../core/Memory");
const Logger_1 = require("../core/Logger");
exports.memoryCommand = {
    command: 'memory <command>',
    describe: 'Manage the memory of the Gemini Flow system',
    builder: (yargs) => yargs
        .command('set <key> <value>', 'Set a value in the memory', {}, (argv) => {
        const memory = new Memory_1.Memory();
        memory.set(argv.key, argv.value);
        Logger_1.Logger.log('[Memory]', `Set '${argv.key}' to '${argv.value}'`);
    })
        .command('get <key>', 'Get a value from the memory', {}, (argv) => {
        const memory = new Memory_1.Memory();
        const value = memory.get(argv.key);
        if (value !== undefined) {
            console.log(value); // Direct output is desired here
        }
        else {
            Logger_1.Logger.warn('[Memory]', `Key '${argv.key}' not found in memory.`);
        }
    })
        .command('list', 'List all keys in the memory', {}, () => {
        const memory = new Memory_1.Memory();
        const allMemory = memory.getAll();
        console.log(Object.keys(allMemory)); // Direct output is desired here
    }),
    handler: () => { },
};
