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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const Logger_1 = require("../core/Logger");
exports.initCommand = {
    command: 'init',
    describe: 'Initialize a new Gemini Flow project',
    builder: {
        sparc: {
            describe: 'Initialize with SPARC development environment',
            type: 'boolean',
        },
    },
    handler: (argv) => {
        Logger_1.Logger.log('[Init]', 'Starting Gemini Flow initialization...');
        const geminiDir = path.join(process.cwd(), '.gemini');
        const promptsDir = path.join(geminiDir, 'prompts', 'modes');
        const configFile = path.join(geminiDir, 'gemini-flow.json');
        if (fs.existsSync(geminiDir)) {
            Logger_1.Logger.warn('[Init]', 'Gemini Flow project already initialized.');
            return;
        }
        Logger_1.Logger.log('[Init]', `Creating directories at: ${promptsDir}`);
        fs.mkdirSync(promptsDir, { recursive: true });
        const defaultConfig = {
            version: '1.0.0',
            agents: [],
        };
        Logger_1.Logger.log('[Init]', `Writing config file to: ${configFile}`);
        fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2));
        const templateDir = path.join(__dirname, '..', 'templates', 'prompts', 'modes');
        if (!fs.existsSync(templateDir)) {
            Logger_1.Logger.error('[Init]', `Template directory not found at ${templateDir}`);
            return;
        }
        const templateFiles = fs.readdirSync(templateDir);
        Logger_1.Logger.log('[Init]', `Found ${templateFiles.length} template files. Copying...`);
        templateFiles.forEach(file => {
            const templatePath = path.join(templateDir, file);
            const newPath = path.join(promptsDir, file);
            fs.copyFileSync(templatePath, newPath);
        });
        if (argv.sparc) {
            const claudeDir = path.join(process.cwd(), '.claude');
            const settingsFile = path.join(claudeDir, 'settings.json');
            Logger_1.Logger.log('[Init]', `Creating .claude directory at: ${claudeDir}`);
            fs.mkdirSync(claudeDir, { recursive: true });
            const settings = {
                "anthropic_api_key": "YOUR_ANTHROPIC_API_KEY",
                "model": "claude-3-opus-20240229",
                "max_tokens": 4096,
                "temperature": 0,
                "tool_config": {
                    "tools": [
                        { "name": "*" }
                    ]
                },
                "bash_config": {
                    "timeout": 300,
                    "max_timeout": 600
                },
                "output_character_limit": 500000,
                "parallel_tool_calls": true,
                "batch_tool_calls": true,
                "auto_save_to_memory": true
            };
            Logger_1.Logger.log('[Init]', `Writing settings file to: ${settingsFile}`);
            fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
        }
        Logger_1.Logger.success('[Init]', 'Gemini Flow project initialized successfully.');
    },
};
