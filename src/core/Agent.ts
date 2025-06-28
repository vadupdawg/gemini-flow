

import { GoogleGenerativeAI } from '@google/generative-ai';

export class Agent {
  private genAI: GoogleGenerativeAI;
  public name: string;
  public mode: string;

  constructor(name: string, mode: string, apiKey: string) {
    this.name = name;
    this.mode = mode;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async run(task: string, systemPrompt?: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const fullPrompt = `${systemPrompt}\n\n## Task\n\n${task}`;

    try {
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error(`[Agent: ${this.name}] Error during API call:`, error);
      return `Error: Could not generate content. Please check your API key and network connection.`;
    }
  }
}

