
import * as fs from 'fs';
import * as path from 'path';

export class Memory {
  private memoryPath: string;

  constructor() {
    this.memoryPath = path.join(process.cwd(), '.gemini', 'memory.json');
    if (!fs.existsSync(this.memoryPath)) {
      fs.writeFileSync(this.memoryPath, JSON.stringify({}));
    }
  }

  set(key: string, value: any) {
    const memory = this.getAll();
    memory[key] = value;
    fs.writeFileSync(this.memoryPath, JSON.stringify(memory, null, 2));
  }

  get(key: string): any {
    const memory = this.getAll();
    return memory[key];
  }

  getAll(): any {
    const content = fs.readFileSync(this.memoryPath, 'utf-8');
    return JSON.parse(content);
  }
}
