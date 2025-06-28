
import * as fs from 'fs';
import * as path from 'path';

export interface Tool {
  name: string;
  description: string;
  execute(args: any): Promise<any>;
}

export class WriteFileTool implements Tool {
  name = 'writeFile';
  description = 'Writes content to a file.';

  async execute(args: { path: string; content: string }): Promise<any> {
    try {
      const fullPath = path.resolve(process.cwd(), args.path);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fullPath, args.content);
      return { success: true, path: fullPath };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

export const tools: { [name: string]: Tool } = {
  writeFile: new WriteFileTool(),
};
