"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCommand = void 0;
const express_1 = __importDefault(require("express"));
const Logger_1 = require("../core/Logger");
exports.startCommand = {
    command: 'start',
    describe: 'Start the Gemini Flow web UI',
    builder: {
        port: {
            describe: 'Port to run the web UI on',
            alias: 'p',
            type: 'number',
            default: 3000,
        },
    },
    handler: (argv) => {
        const app = (0, express_1.default)();
        const port = argv.port;
        app.get('/', (req, res) => {
            res.send('<h1>Gemini Flow</h1><p>Monitoring UI coming soon...</p>');
        });
        app.listen(port, () => {
            Logger_1.Logger.log('[WebUI]', `Gemini Flow UI listening on http://localhost:${port}`);
        });
    },
};
