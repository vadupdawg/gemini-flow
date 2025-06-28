import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../core/Logger';
import { CommandModule } from 'yargs';

export const initCommand: CommandModule = {
  command: 'init',
  describe: 'Initialize a new Gemini Flow project',
  builder: {
    sparc: {
      describe: 'Initialize with SPARC development environment',
      type: 'boolean',
    },
  },
  handler: (argv) => {
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

    if (argv.sparc) {
      const claudeDir = path.join(process.cwd(), '.claude');
      const settingsFile = path.join(claudeDir, 'settings.json');
      
      Logger.log('[Init]', `Creating .claude directory at: ${claudeDir}`);
      fs.mkdirSync(claudeDir, { recursive: true });

      const settings = {
        "anthropic_api_key": "YOUR_ANTHROPIC_API_KEY",
        "model": "claude-3-opus-20240229",
        "max_tokens": 4096,
        "temperature": 0,
        "tool_config": {
          "tools": [
            { "name": "*" }
          ]
        },
        "bash_config": {
          "timeout": 300,
          "max_timeout": 600
        },
        "output_character_limit": 500000,
        "parallel_tool_calls": true,
        "batch_tool_calls": true,
        "auto_save_to_memory": true
      };
      
      Logger.log('[Init]', `Writing settings file to: ${settingsFile}`);
      fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    }

    Logger.success('[Init]', 'Gemini Flow project initialized successfully.');
  },
};