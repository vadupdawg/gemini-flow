"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCommand = void 0;
const commander_1 = require("commander");
const express_1 = __importDefault(require("express"));
const startCommand = () => {
    const command = new commander_1.Command('start')
        .description('Start the Gemini Flow web UI')
        .option('-p, --port <port>', 'Port to run the web UI on', '3000')
        .action((options) => {
        const app = (0, express_1.default)();
        const port = parseInt(options.port, 10);
        app.get('/', (req, res) => {
            res.send('<h1>Gemini Flow</h1><p>Monitoring UI coming soon...</p>');
        });
        app.listen(port, () => {
            console.log(`Gemini Flow UI listening on port ${port}`);
        });
    });
    return command;
};
exports.startCommand = startCommand;
