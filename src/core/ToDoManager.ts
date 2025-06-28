import * as fs from 'fs';
import * as path from 'path';

export interface ToDoItem {
  id: number;
  task: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  dependencies: number[];
  result?: any;
}

export class ToDoManager {
  private todoFilePath: string;
  private todos: ToDoItem[] = [];

  constructor() {
    this.todoFilePath = path.join(process.cwd(), 'todo.json');
    this.loadToDos();
  }

  private loadToDos() {
    if (fs.existsSync(this.todoFilePath)) {
      const fileContent = fs.readFileSync(this.todoFilePath, 'utf-8');
      const data = JSON.parse(fileContent);
      this.todos = data.todos || [];
    }
  }

  private saveToDos() {
    const data = { todos: this.todos };
    fs.writeFileSync(this.todoFilePath, JSON.stringify(data, null, 2));
  }

  getToDoList(): ToDoItem[] {
    return this.todos;
  }

  addTask(task: string, dependencies: number[] = []): ToDoItem {
    const newId = this.todos.length > 0 ? Math.max(...this.todos.map(t => t.id)) + 1 : 1;
    const newTask: ToDoItem = {
      id: newId,
      task,
      status: 'pending',
      dependencies,
    };
    this.todos.push(newTask);
    this.saveToDos();
    return newTask;
  }

  getNextTask(): ToDoItem | null {
    for (const todo of this.todos) {
      if (todo.status === 'pending') {
        const dependenciesMet = todo.dependencies.every(depId => {
          const dep = this.todos.find(t => t.id === depId);
          return dep && dep.status === 'completed';
        });
        if (dependenciesMet) {
          return todo;
        }
      }
    }
    return null;
  }

  updateTaskStatus(taskId: number, status: 'in_progress' | 'completed' | 'failed', result?: any) {
    const todo = this.todos.find(t => t.id === taskId);
    if (todo) {
      todo.status = status;
      if (result) {
        todo.result = result;
      }
      this.saveToDos();
    }
  }
}
