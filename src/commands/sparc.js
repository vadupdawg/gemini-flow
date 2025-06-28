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
const commander_1 = require("commander");
const Orchestrator_1 = require("../core/Orchestrator");
const Agent_1 = require("../core/Agent");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const sparcCommand = () => {
    const command = new commander_1.Command('sparc')
        .description('Run a SPARC workflow')
        .option('--parallel', 'Run agents in parallel')
        .action((options) => __awaiter(void 0, void 0, void 0, function* () {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY not found in .env file.');
            return;
        }
        const orchestrator = new Orchestrator_1.Orchestrator();
        // Create agents with the API key
        orchestrator.addAgent(new Agent_1.Agent('architect', 'architecture', apiKey));
        orchestrator.addAgent(new Agent_1.Agent('coder', 'coding', apiKey));
        // Define a memory-driven workflow
        const workflow = [
            {
                agent: 'architect',
                task: 'Design a REST API for a simple e-commerce application. The output should be a JSON object representing the API design.',
                outputKey: 'api_design'
            },
            {
                agent: 'coder',
                task: 'Based on the provided API design, implement the user endpoint in Node.js with Express.',
                inputKey: 'api_design',
                outputKey: 'user_endpoint_code'
            },
        ];
        // Run the workflow
        yield orchestrator.runWorkflow(workflow, options.parallel);
        console.log("\nWorkflow finished. Check the memory for the results.");
    }));
    return command;
};
exports.sparcCommand = sparcCommand;
