import { ToDoManager } from '../core/ToDoManager';
import * as fs from 'fs';
import * as path from 'path';

describe('ToDoManager', () => {
  const todoFilePath = path.join(process.cwd(), 'todo.json');
  let toDoManager: ToDoManager;

  beforeEach(() => {
    // Ensure the file is clean before each test
    if (fs.existsSync(todoFilePath)) {
      fs.unlinkSync(todoFilePath);
    }
    toDoManager = new ToDoManager();
  });

  afterEach(() => {
    // Clean up the file after each test
    if (fs.existsSync(todoFilePath)) {
      fs.unlinkSync(todoFilePath);
    }
  });

  it('should add a task', () => {
    const task = toDoManager.addTask('Test task', 'coder');
    expect(task.task).toBe('Test task');
    expect(task.agent).toBe('coder');
    expect(task.status).toBe('pending');
    const tasks = toDoManager.getAllTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toEqual(task);
  });

  it('should get the next task', () => {
    toDoManager.addTask('Test task 1', 'coder');
    toDoManager.addTask('Test task 2', 'architect');
    const nextTask = toDoManager.getNextTask();
    expect(nextTask).not.toBeNull();
    expect(nextTask?.task).toBe('Test task 1');
  });

  it('should update task status', () => {
    const task = toDoManager.addTask('Test task', 'coder');
    toDoManager.updateTaskStatus(task.id, 'completed');
    const updatedTask = toDoManager.getTaskById(task.id);
    expect(updatedTask?.status).toBe('completed');
  });

  it('should respect dependencies', () => {
    const task1 = toDoManager.addTask('Task 1', 'coder');
    const task2 = toDoManager.addTask('Task 2', 'architect', [task1.id]);
    let nextTask = toDoManager.getNextTask();
    expect(nextTask?.id).toBe(task1.id);
    toDoManager.updateTaskStatus(task1.id, 'completed');
    nextTask = toDoManager.getNextTask();
    expect(nextTask?.id).toBe(task2.id);
  });
});
