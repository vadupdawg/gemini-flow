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
const executor_1 = require("./executor");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
const tools_1 = require("./tools");
const Logger_1 = require("./Logger");
const ToDoManager_1 = require("./ToDoManager");
class Orchestrator {
    constructor(apiKey, toDoManager) {
        this.agents = {};
        this.executor = new executor_1.Executor();
        this.apiKey = apiKey;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        this.toDoManager = toDoManager || new ToDoManager_1.ToDoManager();
        this.tools = (0, tools_1.getTools)(this.toDoManager);
    }
    confirmExecution(command) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                const prompt = Logger_1.Logger.security('[SECURITY]', command, 'Do you want to allow this? (y/n): ');
                this.rl.question(prompt, (answer) => {
                    resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
                });
            });
        });
    }
    addAgent(name, mode) {
        if (!this.agents[name]) {
            this.agents[name] = { mode };
        }
    }
    getAgent(name) {
        return this.agents[name];
    }
    getSystemPrompt(mode) {
        const userPromptPath = path.join(process.cwd(), '.gemini', 'prompts', 'modes', `${mode}.md`);
        if (fs.existsSync(userPromptPath)) {
            return fs.readFileSync(userPromptPath, 'utf-8');
        }
        const templatePath = path.join(__dirname, '..', 'templates', 'prompts', 'modes', `${mode}.md`);
        if (fs.existsSync(templatePath)) {
            return fs.readFileSync(templatePath, 'utf-8');
        }
        Logger_1.Logger.warn(`[Orchestrator]`, `System prompt for mode '${mode}' not found. Using a default.`);
        return `You are a helpful assistant with the role: ${mode}.`;
    }
    buildTaskWithContext(task, dependencies) {
        let context = '';
        if (dependencies.length > 0) {
            const contextData = dependencies.map(dep => ({
                task: dep.task,
                result: dep.result,
            }));
            context = `\n\n## Context from Completed Tasks\n\n${JSON.stringify(contextData, null, 2)}`;
        }
        return `${task}${context}`;
    }
    executeTool(toolName, args, agentName) {
        return __awaiter(this, void 0, void 0, function* () {
            const tool = this.tools[toolName];
            if (!tool) {
                Logger_1.Logger.error(`[Agent: ${agentName}]`, `Unknown tool '${toolName}'`);
                return { success: false, error: `Unknown tool '${toolName}'` };
            }
            if (tool.name === 'runShellCommand') {
                const allowed = yield this.confirmExecution(args.command);
                if (!allowed) {
                    Logger_1.Logger.warn(`[Orchestrator]`, `Execution of command denied by user.`);
                    return { success: false, error: 'Execution denied by user' };
                }
            }
            const result = yield tool.execute(args);
            if (result.success) {
                Logger_1.Logger.success(`[Agent: ${agentName}]`, `Used tool '${toolName}'.`);
            }
            else {
                Logger_1.Logger.error(`[Agent: ${agentName}]`, `Tool '${toolName}' failed: ${result.error}`);
            }
            return result;
        });
    }
    run(initialPrompt_1) {
        return __awaiter(this, arguments, void 0, function* (initialPrompt, initialAgent = 'coder') {
            this.toDoManager.addTask(initialPrompt, initialAgent);
            yield this.processQueue();
        });
    }
    processQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            let nextTask = this.toDoManager.getNextTask();
            while (nextTask) {
                const currentTask = nextTask;
                this.toDoManager.updateTaskStatus(currentTask.id, 'in_progress');
                const agentName = currentTask.agent;
                const agent = this.getAgent(agentName);
                if (!agent) {
                    Logger_1.Logger.error(`[Orchestrator]`, `Agent ${agentName} not found.`);
                    this.toDoManager.updateTaskStatus(currentTask.id, 'failed', 'Agent not found');
                    nextTask = this.toDoManager.getNextTask();
                    continue;
                }
                const dependencies = currentTask.dependencies
                    .map(depId => this.toDoManager.getTaskById(depId))
                    .filter((t) => !!t);
                const taskWithContext = this.buildTaskWithContext(currentTask.task, dependencies);
                const systemPrompt = this.getSystemPrompt(agent.mode);
                Logger_1.Logger.log(`[Agent: ${agentName}]`, `Starting task #${currentTask.id}: ${currentTask.task}`);
                const executionResult = yield this.executor.run({
                    task: taskWithContext,
                    systemPrompt,
                    apiKey: this.apiKey,
                });
                if (!executionResult.success || executionResult.error) {
                    Logger_1.Logger.error(`[Agent: ${agentName}]`, `Task failed: ${executionResult.error}`);
                    this.toDoManager.updateTaskStatus(currentTask.id, 'failed', executionResult.error);
                    nextTask = this.toDoManager.getNextTask();
                    continue;
                }
                Logger_1.Logger.log(`[Agent: ${agentName}]`, `Raw output:\n---\n${executionResult.output}\n---`);
                try {
                    const result = JSON.parse(executionResult.output);
                    if (result.tool) {
                        yield this.executeTool(result.tool, result.args, agentName);
                    }
                    else {
                        this.toDoManager.updateTaskStatus(currentTask.id, 'completed', result.content);
                        Logger_1.Logger.success(`[Agent: ${agentName}]`, `Completed task #${currentTask.id}.`);
                    }
                }
                catch (e) {
                    Logger_1.Logger.warn(`[Agent: ${agentName}]`, `Output was not valid JSON. Treating as raw text and marking task as completed.`);
                    this.toDoManager.updateTaskStatus(currentTask.id, 'completed', executionResult.output);
                }
                nextTask = this.toDoManager.getNextTask();
            }
            Logger_1.Logger.success('[Orchestrator]', 'All tasks have been completed.');
            this.rl.close();
        });
    }
}
exports.Orchestrator = Orchestrator;
