
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

export const initCommand = () => {
  const command = new Command('init')
    .description('Initialize a new Gemini Flow project')
    .action(() => {
      const geminiDir = path.join(process.cwd(), '.gemini');
      const promptsDir = path.join(geminiDir, 'prompts', 'modes');
      const configFile = path.join(geminiDir, 'gemini-flow.json');

      if (fs.existsSync(geminiDir)) {
        console.log('Gemini Flow project already initialized.');
        return;
      }

      fs.mkdirSync(promptsDir, { recursive: true });

      const defaultConfig = {
        version: '1.0.0',
        agents: [],
      };

      fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2));

      const templateDir = path.join(__dirname, '..', 'templates', 'prompts', 'modes');
      fs.readdirSync(templateDir).forEach(file => {
        const templatePath = path.join(templateDir, file);
        const newPath = path.join(promptsDir, file);
        fs.copyFileSync(templatePath, newPath);
      });

      console.log('Gemini Flow project initialized successfully.');
    });

  return command;
};
