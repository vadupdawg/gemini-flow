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
const Agent_1 = require("../core/Agent");
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
dotenv.config();
const swarmCommand = () => {
    const command = new commander_1.Command('swarm')
        .description('Run a swarm of agents to achieve a high-level goal')
        .argument('<goal>', 'The high-level goal for the swarm')
        .action((goal) => __awaiter(void 0, void 0, void 0, function* () {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY not found in .env file.');
            return;
        }
        console.log(`[Swarm] Goal received: "${goal}"`);
        console.log('[Swarm] Initializing swarm-coordinator to generate a plan...');
        // 1. Generate the plan using the swarm-coordinator
        const coordinator = new Agent_1.Agent('swarm-coordinator', 'swarm-coordination', apiKey);
        const coordinatorPromptPath = path.join(process.cwd(), '.gemini', 'prompts', 'modes', 'swarm-coordinator.md');
        const coordinatorPrompt = fs.readFileSync(coordinatorPromptPath, 'utf-8');
        const planJson = yield coordinator.run(goal, coordinatorPrompt);
        let workflow;
        try {
            // The AI's output might have markdown formatting, so we need to extract the JSON
            const jsonMatch = planJson.match(/```json\n([\s\S]*?)\n```/);
            const extractedJson = jsonMatch ? jsonMatch[1] : planJson;
            workflow = JSON.parse(extractedJson);
            console.log('[Swarm] Plan generated successfully:');
            console.log(JSON.stringify(workflow, null, 2));
        }
        catch (error) {
            console.error('[Swarm] Failed to parse the plan from the swarm-coordinator.');
            console.error('Received output:', planJson);
            return;
        }
        // 2. Execute the generated workflow
        console.log('\n[Swarm] Executing the generated plan...');
        const orchestrator = new Orchestrator_1.Orchestrator();
        // Dynamically add all required agents to the orchestrator
        const requiredAgents = [...new Set(workflow.map(step => step.agent))];
        for (const agentName of requiredAgents) {
            // We assume the mode is the same as the agent name for simplicity
            orchestrator.addAgent(new Agent_1.Agent(agentName, agentName, apiKey));
        }
        yield orchestrator.runWorkflow(workflow);
        console.log('\n[Swarm] Workflow finished.');
    }));
    return command;
};
exports.swarmCommand = swarmCommand;
