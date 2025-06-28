
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { ToDoManager } from './ToDoManager';

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

export class RunShellCommandTool implements Tool {
    name = 'runShellCommand';
    description = 'Executes a shell command.';
  
    async execute(args: { command: string }): Promise<any> {
      return new Promise((resolve) => {
        exec(args.command, (error, stdout, stderr) => {
          if (error) {
            resolve({ success: false, error: error.message, stdout, stderr });
            return;
          }
          resolve({ success: true, stdout, stderr });
        });
      });
    }
  }

export class AddToDoTool implements Tool {
    name = 'addToDo';
    description = 'Adds a new task to the to-do list.';
    
    constructor(private toDoManager: ToDoManager) {}

    async execute(args: { task: string; dependencies?: number[] }): Promise<any> {
        const newToDo = this.toDoManager.addTask(args.task, args.dependencies);
        return { success: true, todo: newToDo };
    }
}

export class GetToDoListTool implements Tool {
    name = 'getToDoList';
    description = 'Gets the current to-do list.';

    constructor(private toDoManager: ToDoManager) {}

    async execute(): Promise<any> {
        const todos = this.toDoManager.getToDoList();
        return { success: true, todos };
    }
}

export class UpdateTaskStatusTool implements Tool {
    name = 'updateTaskStatus';
    description = 'Updates the status of a task.';

    constructor(private toDoManager: ToDoManager) {}

    async execute(args: { taskId: number; status: 'in_progress' | 'completed' | 'failed'; result?: any }): Promise<any> {
        this.toDoManager.updateTaskStatus(args.taskId, args.status, args.result);
        return { success: true };
    }
}

export const getTools = (toDoManager: ToDoManager): { [name: string]: Tool } => ({
  writeFile: new WriteFileTool(),
  runShellCommand: new RunShellCommandTool(),
  addToDo: new AddToDoTool(toDoManager),
  getToDoList: new GetToDoListTool(toDoManager),
  updateTaskStatus: new UpdateTaskStatusTool(toDoManager),
});
