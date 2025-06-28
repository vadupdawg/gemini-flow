
import { Agent } from './Agent';
import * as fs from 'fs';
import * as path from 'path';

interface Tool {
  [key: string]: (filePath: string, content: string) => { success: boolean; path?: string; error?: string; };
}

interface ToolSet {
  [key: string]: Tool;
}

// A simple FileSystem tool
const tools: ToolSet = {
  filesystem: {
    writeFile: (filePath: string, content: string): { success: boolean; path?: string; error?: string } => {
      try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, content);
        return { success: true, path: filePath };
      } catch (e) {
        if (e instanceof Error) {
          return { success: false, error: e.message };
        }
        return { success: false, error: 'An unknown error occurred during file write.' };
      }
    },
  },
};

async function main() {
  let input = '';
  process.stdin.on('data', (chunk) => {
    input += chunk;
  });

  process.stdin.on('end', async () => {
    try {
      const { task, systemPrompt, apiKey } = JSON.parse(input);
      const agent = new Agent('task-runner-agent', 'task-runner-mode', apiKey);
      const rawResult = await agent.run(task, systemPrompt);

      // Attempt to parse the result as JSON
      try {
        const jsonResult = JSON.parse(rawResult);
        
        if (jsonResult.status === 'failure') {
          process.stderr.write(`Agent reported failure: ${jsonResult.reason}`);
          process.exit(1); // Exit with error code to signal failure
        }

        if (jsonResult.tool) {
          const [toolName, functionName] = jsonResult.tool.split('.');
          
          if (tools[toolName] && tools[toolName][functionName]) {
            const toolResult = tools[toolName][functionName](jsonResult.path, jsonResult.content);
            if (toolResult.success) {
              // On success, output the path to the created file
              process.stdout.write(JSON.stringify({ success: true, type: 'file', path: toolResult.path }));
            } else {
              process.stderr.write(`Tool execution failed: ${toolResult.error}`);
              process.exit(1);
            }
          } else {
            process.stderr.write(`Unknown tool: ${jsonResult.tool}`);
            process.exit(1);
          }
        } else if (jsonResult.content) {
           process.stdout.write(JSON.stringify({ success: true, type: 'text', content: jsonResult.content }));
        }

      } catch (e) {
        // Not valid JSON, treat as plain text output
        process.stdout.write(JSON.stringify({ success: true, type: 'text', content: rawResult }));
      }

      process.exit(0);
    } catch (error) {
      if (error instanceof Error) {
        process.stderr.write(error.message);
      } else {
        process.stderr.write('An unknown error occurred in the task runner.');
      }
      process.exit(1);
    }
  });
}

main();
