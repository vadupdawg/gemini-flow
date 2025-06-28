import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

export const initCommand = () => {
  const command = new Command('init')
    .description('Initialize a new Gemini Flow project')
    .action(() => {
      console.log('--- Starting Gemini Flow Init ---');
      const geminiDir = path.join(process.cwd(), '.gemini');
      const promptsDir = path.join(geminiDir, 'prompts', 'modes');
      const configFile = path.join(geminiDir, 'gemini-flow.json');

      if (fs.existsSync(geminiDir)) {
        console.log('Gemini Flow project already initialized.');
        return;
      }
      console.log(`Creating directories at: ${promptsDir}`);
      fs.mkdirSync(promptsDir, { recursive: true });

      const defaultConfig = {
        version: '1.0.0',
        agents: [],
      };
      console.log(`Writing config file to: ${configFile}`);
      fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2));

      const templateDir = path.join(__dirname, '..', 'templates', 'prompts', 'modes');
      console.log(`Template directory path: ${templateDir}`);

      if (!fs.existsSync(templateDir)) {
        console.error(`ERROR: Template directory not found at ${templateDir}`);
        return;
      }

      const templateFiles = fs.readdirSync(templateDir);
      console.log(`Found ${templateFiles.length} template files:`, templateFiles);

      templateFiles.forEach(file => {
        const templatePath = path.join(templateDir, file);
        const newPath = path.join(promptsDir, file);
        console.log(`Copying ${templatePath} to ${newPath}`);
        fs.copyFileSync(templatePath, newPath);
      });

      console.log('--- Gemini Flow Init Finished ---');
      console.log('Gemini Flow project initialized successfully.');
    });

  return command;
};