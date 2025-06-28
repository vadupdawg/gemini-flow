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
exports.Orchestrator = void 0;
const Memory_1 = require("./Memory");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class Orchestrator {
    constructor() {
        this.agents = [];
        this.memory = new Memory_1.Memory();
    }
    addAgent(agent) {
        this.agents.push(agent);
    }
    getAgent(name) {
        return this.agents.find(agent => agent.name === name);
    }
    getSystemPrompt(mode) {
        const promptPath = path.join(process.cwd(), '.gemini', 'prompts', 'modes', `${mode}.md`);
        if (fs.existsSync(promptPath)) {
            return fs.readFileSync(promptPath, 'utf-8');
        }
        return undefined;
    }
    buildTaskWithContext(task, inputKeys) {
        if (!inputKeys) {
            return task;
        }
        const inputs = {};
        const keys = Array.isArray(inputKeys) ? inputKeys : [inputKeys];
        for (const key of keys) {
            inputs[key] = this.memory.get(key);
        }
        return `${task}\n\n## Context from Memory\n\n${JSON.stringify(inputs, null, 2)}`;
    }
    runWorkflow(workflow_1) {
        return __awaiter(this, arguments, void 0, function* (workflow, parallel = false) {
            const runStep = (step) => __awaiter(this, void 0, void 0, function* () {
                const agent = this.getAgent(step.agent);
                if (!agent) {
                    console.error(`[Orchestrator] Agent ${step.agent} not found.`);
                    return;
                }
                const taskWithContext = this.buildTaskWithContext(step.task, step.inputKey);
                const systemPrompt = this.getSystemPrompt(agent.mode);
                const result = yield agent.run(taskWithContext, systemPrompt);
                if (step.outputKey) {
                    const strategy = step.memoryUpdateStrategy || 'overwrite';
                    const existingValue = this.memory.get(step.outputKey);
                    let newValue = result;
                    switch (strategy) {
                        case 'append':
                            newValue = existingValue ? `${existingValue}\n\n---\n\n${result}` : result;
                            break;
                        case 'merge':
                            try {
                                const existingJson = existingValue ? JSON.parse(existingValue) : {};
                                const newJson = JSON.parse(result);
                                newValue = JSON.stringify(Object.assign(Object.assign({}, existingJson), newJson), null, 2);
                            }
                            catch (e) {
                                console.error(`[Orchestrator] Merge failed for key '${step.outputKey}'. Defaulting to append.`);
                                newValue = existingValue ? `${existingValue}\n\n---\n\n${result}` : result;
                            }
                            break;
                        case 'overwrite':
                        default:
                            // newValue is already the result
                            break;
                    }
                    this.memory.set(step.outputKey, newValue);
                    console.log(`[Orchestrator] Agent ${agent.name} saved output to memory key '${step.outputKey}' using strategy '${strategy}'`);
                }
                else {
                    console.log(result);
                }
            });
            if (parallel) {
                yield Promise.all(workflow.map(runStep));
            }
            else {
                for (const step of workflow) {
                    yield runStep(step);
                }
            }
        });
    }
}
exports.Orchestrator = Orchestrator;
