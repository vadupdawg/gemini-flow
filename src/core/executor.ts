
import { spawn } from 'child_process';
import * as path from 'path';

export interface TaskExecution {
  task: string;
  systemPrompt: string;
  apiKey: string;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
}

export class Executor {
  public async run(execution: TaskExecution): Promise<ExecutionResult> {
    return new Promise((resolve, reject) => {
      const taskRunnerPath = path.join(__dirname, 'task-runner.js');
      const process = spawn('node', [taskRunnerPath]);

      let output = '';
      let error = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output });
        } else {
          resolve({ success: false, output, error });
        }
      });

      process.on('error', (err) => {
        reject({ success: false, error: err.message });
      });

      // Send the task to the child process
      process.stdin.write(JSON.stringify(execution));
      process.stdin.end();
    });
  }
}
