"use strict";
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
exports.Agent = void 0;
const generative_ai_1 = require("@google/generative-ai");
class Agent {
    constructor(name, mode, apiKey) {
        this.name = name;
        this.mode = mode;
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    run(task, systemPrompt) {
        return __awaiter(this, void 0, void 0, function* () {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const fullPrompt = `${systemPrompt}\n\n## Task\n\n${task}`;
            try {
                const result = yield model.generateContent(fullPrompt);
                const response = yield result.response;
                return response.text();
            }
            catch (error) {
                console.error(`[Agent: ${this.name}] Error during API call:`, error);
                return `Error: Could not generate content. Please check your API key and network connection.`;
            }
        });
    }
}
exports.Agent = Agent;
