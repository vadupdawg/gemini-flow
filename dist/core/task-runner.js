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
const Agent_1 = require("./Agent");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// A simple FileSystem tool
const tools = {
    filesystem: {
        writeFile: (filePath, content) => {
            try {
                const dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                fs.writeFileSync(filePath, content);
                return { success: true, path: filePath };
            }
            catch (e) {
                if (e instanceof Error) {
                    return { success: false, error: e.message };
                }
                return { success: false, error: 'An unknown error occurred during file write.' };
            }
        },
    },
};
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let input = '';
        process.stdin.on('data', (chunk) => {
            input += chunk;
        });
        process.stdin.on('end', () => __awaiter(this, void 0, void 0, function* () {
            try {
                const { task, systemPrompt, apiKey } = JSON.parse(input);
                const agent = new Agent_1.Agent('task-runner-agent', 'task-runner-mode', apiKey);
                const rawResult = yield agent.run(task, systemPrompt);
                // Attempt to parse the result as JSON
                try {
                    const jsonResult = JSON.parse(rawResult);
                    if (jsonResult.status === 'failure') {
                        process.stderr.write(`Agent reported failure: ${jsonResult.reason}`);
                        process.exit(1); // Exit with error code to signal failure
                    }
                    if (jsonResult.tool) {
                        const [toolName, functionName] = jsonResult.tool.split('.');
                        if (tools[toolName] && tools[toolName][functionName]) {
                            const toolResult = tools[toolName][functionName](jsonResult.path, jsonResult.content);
                            if (toolResult.success) {
                                // On success, output the path to the created file
                                process.stdout.write(JSON.stringify({ success: true, type: 'file', path: toolResult.path }));
                            }
                            else {
                                process.stderr.write(`Tool execution failed: ${toolResult.error}`);
                                process.exit(1);
                            }
                        }
                        else {
                            process.stderr.write(`Unknown tool: ${jsonResult.tool}`);
                            process.exit(1);
                        }
                    }
                    else if (jsonResult.content) {
                        process.stdout.write(JSON.stringify({ success: true, type: 'text', content: jsonResult.content }));
                    }
                }
                catch (e) {
                    // Not valid JSON, treat as plain text output
                    process.stdout.write(JSON.stringify({ success: true, type: 'text', content: rawResult }));
                }
                process.exit(0);
            }
            catch (error) {
                if (error instanceof Error) {
                    process.stderr.write(error.message);
                }
                else {
                    process.stderr.write('An unknown error occurred in the task runner.');
                }
                process.exit(1);
            }
        }));
    });
}
main();
