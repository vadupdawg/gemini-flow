

import { GoogleGenerativeAI } from '@google/generative-ai';

export class Agent {
  private genAI: GoogleGenerativeAI;

  constructor(public name: string, public mode: string, apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async run(task: string, systemPrompt?: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const fullPrompt = `${systemPrompt}\n\n## Task\n\n${task}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  }
}

