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
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = void 0;
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const initCommand = () => {
    const command = new commander_1.Command('init')
        .description('Initialize a new Gemini Flow project')
        .action(() => {
        const geminiDir = path.join(process.cwd(), '.gemini');
        const promptsDir = path.join(geminiDir, 'prompts');
        const configFile = path.join(geminiDir, 'gemini-flow.json');
        if (fs.existsSync(geminiDir)) {
            console.log('Gemini Flow project already initialized.');
            return;
        }
        fs.mkdirSync(geminiDir, { recursive: true });
        fs.mkdirSync(promptsDir, { recursive: true });
        const defaultConfig = {
            version: '1.0.0',
            agents: [],
        };
        fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2));
        console.log('Gemini Flow project initialized successfully.');
    });
    return command;
};
exports.initCommand = initCommand;
