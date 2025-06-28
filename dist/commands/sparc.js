"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sparcCommand = void 0;
const Logger_1 = require("../core/Logger");
const executor_1 = require("../core/executor");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
exports.sparcCommand = {
    command: 'sparc <command>',
    describe: 'Run a SPARC command',
    builder: (yargs) => yargs
        .command('run <mode> <prompt>', 'Run a SPARC mode', {}, (argv) => __awaiter(void 0, void 0, void 0, function* () {
        const { mode, prompt } = argv;
        Logger_1.Logger.log('[SPARC]', `Running mode '${mode}' with prompt: '${prompt}'`);
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            Logger_1.Logger.error('[SPARC]', 'GEMINI_API_KEY not found in .env file.');
            return;
        }
        const systemPromptPath = path.join(process.cwd(), '.gemini', 'prompts', 'modes', `${mode}.md`);
        if (!fs.existsSync(systemPromptPath)) {
            Logger_1.Logger.error('[SPARC]', `Mode '${mode}' not found at ${systemPromptPath}`);
            return;
        }
        const systemPrompt = fs.readFileSync(systemPromptPath, 'utf-8');
        const executor = new executor_1.Executor();
        const result = yield executor.run({
            task: prompt,
            systemPrompt,
            apiKey,
        });
        if (result.success) {
            Logger_1.Logger.log('[SPARC]', `Execution successful. Output:\n${result.output}`);
        }
        else {
            Logger_1.Logger.error('[SPARC]', `Execution failed: ${result.error}`);
        }
    }))
        .command('modes', 'List all available SPARC modes', {}, () => {
        const modesDir = path.join(process.cwd(), '.gemini', 'prompts', 'modes');
        if (!fs.existsSync(modesDir)) {
            Logger_1.Logger.error('[SPARC]', 'Modes directory not found.');
            return;
        }
        const modes = fs.readdirSync(modesDir).map(file => file.replace('.md', ''));
        Logger_1.Logger.log('[SPARC]', 'Available modes:');
        console.log(modes.join('\n'));
    }),
    handler: () => { },
};
