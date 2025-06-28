import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../core/Logger';

export const initCommand = () => {
  const command = new Command('init')
    .description('Initialize a new Gemini Flow project')
    .action(() => {
      Logger.log('[Init]', 'Starting Gemini Flow initialization...');
      const geminiDir = path.join(process.cwd(), '.gemini');
      const promptsDir = path.join(geminiDir, 'prompts', 'modes');
      const configFile = path.join(geminiDir, 'gemini-flow.json');

      if (fs.existsSync(geminiDir)) {
        Logger.warn('[Init]', 'Gemini Flow project already initialized.');
        return;
      }
      
      Logger.log('[Init]', `Creating directories at: ${promptsDir}`);
      fs.mkdirSync(promptsDir, { recursive: true });

      const defaultConfig = {
        version: '1.0.0',
        agents: [],
      };
      Logger.log('[Init]', `Writing config file to: ${configFile}`);
      fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2));

      const templateDir = path.join(__dirname, '..', 'templates', 'prompts', 'modes');
      if (!fs.existsSync(templateDir)) {
        Logger.error('[Init]', `Template directory not found at ${templateDir}`);
        return;
      }

      const templateFiles = fs.readdirSync(templateDir);
      Logger.log('[Init]', `Found ${templateFiles.length} template files. Copying...`);

      templateFiles.forEach(file => {
        const templatePath = path.join(templateDir, file);
        const newPath = path.join(promptsDir, file);
        fs.copyFileSync(templatePath, newPath);
      });

      Logger.success('[Init]', 'Gemini Flow project initialized successfully.');
    });

  return command;
};
