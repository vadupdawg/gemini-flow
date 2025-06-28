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
exports.swarmCommand = void 0;
const commander_1 = require("commander");
const Orchestrator_1 = require("../core/Orchestrator");
const dotenv = __importStar(require("dotenv"));
const Logger_1 = require("../core/Logger");
const executor_1 = require("../core/executor");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ToDoManager_1 = require("../core/ToDoManager");
dotenv.config();
const swarmCommand = () => {
    const command = new commander_1.Command('swarm')
        .description('Run a swarm of agents to achieve a high-level goal')
        .argument('<goal>', 'The high-level goal for the swarm')
        .action((goal) => __awaiter(void 0, void 0, void 0, function* () {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            Logger_1.Logger.error('[Swarm]', 'GEMINI_API_KEY not found in .env file.');
            return;
        }
        Logger_1.Logger.log('[Swarm]', `Goal received: "${goal}"`);
        const orchestrator = new Orchestrator_1.Orchestrator(apiKey);
        const executor = new executor_1.Executor();
        const toDoManager = new ToDoManager_1.ToDoManager();
        // Define all possible agents in the swarm
        const agents = [
            'swarm-coordinator', 'requirements_gatherer', 'architect', 'coder',
            'data_provider', 'backtester', 'reviewer', 'risk_manager', 'documenter'
        ];
        for (const agent of agents) {
            orchestrator.addAgent(agent, agent);
        }
        // Step 1: Use a swarm-coordinator to generate a plan
        Logger_1.Logger.log('[Swarm]', 'Initializing swarm-coordinator to generate a plan...');
        const coordinatorPrompt = `Based on the following goal, create a detailed plan as a series of tasks. For each task, specify the most appropriate agent to perform it. The available agents are: ${agents.join(', ')}. The goal is: "${goal}"`;
        const systemPromptPath = path.join(__dirname, '..', 'templates', 'prompts', 'modes', `swarm-coordinator.md`);
        const systemPrompt = fs.readFileSync(systemPromptPath, 'utf-8');
        const planResult = yield executor.run({
            task: coordinatorPrompt,
            systemPrompt,
            apiKey,
        });
        if (!planResult.success || planResult.error) {
            Logger_1.Logger.error('[Swarm]', `Failed to generate a plan: ${planResult.error}`);
            return;
        }
        try {
            // Extract the JSON content from the agent's output
            let rawContent = JSON.parse(planResult.output).content;
            rawContent = rawContent.replace(/```json\n/g, '').replace(/\n```$/g, '');
            const plan = JSON.parse(rawContent);
            Logger_1.Logger.success('[Swarm]', 'Plan generated successfully.');
            // Step 2: Add the generated plan to the to-do list
            Logger_1.Logger.log('[Swarm]', 'Adding generated plan to the to-do list...');
            for (const task of plan) {
                toDoManager.addTask(task.task, task.agent, task.dependencies);
            }
            // Step 3: Execute the plan
            Logger_1.Logger.log('[Swarm]', 'Starting orchestrator to execute the plan...');
            yield orchestrator.run(`The plan has been generated and added to the to-do list. Start executing the first available task.`);
        }
        catch (e) {
            Logger_1.Logger.error('[Swarm]', `Failed to parse the generated plan. Error: ${e.message}. Raw output:\n${planResult.output}`);
        }
    }));
    return command;
};
exports.swarmCommand = swarmCommand;
