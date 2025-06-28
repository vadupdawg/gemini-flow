import { CommandModule } from 'yargs';
import { Logger } from '../core/Logger';
import { ToDoManager } from '../core/ToDoManager';

const toDoManager = new ToDoManager();

export const taskCommand: CommandModule = {
  command: 'task <command>',
  describe: 'Manage tasks',
  builder: (yargs) =>
    yargs
      .command('create <task> [agent] [dependencies..]', 'Create a new task', {}, (argv) => {
        const { task, agent, dependencies } = argv;
        toDoManager.addTask(task as string, agent as string, dependencies as string[]);
        Logger.log('[Task]', `Created task: "${task}"`);
      })
      .command('list', 'List all tasks', {}, () => {
        const tasks = toDoManager.getAllTasks();
        console.log(tasks);
      })
      .command('next', 'Get the next task to be executed', {}, () => {
        const nextTask = toDoManager.getNextTask();
        if (nextTask) {
          console.log(nextTask);
        } else {
          Logger.log('[Task]', 'No more tasks to execute.');
        }
      }),
  handler: () => {},
};