import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const TODOS_FILE = path.join(os.homedir(), '.janex', 'todos.json');

export interface TodoItem {
  id: number;
  task: string;
  done: boolean;
  createdAt: number;
}

export class TodoStore {
  private todos: TodoItem[] = [];
  private nextId = 1;

  async load(): Promise<void> {
    if (await fs.pathExists(TODOS_FILE)) {
      try {
        this.todos = await fs.readJson(TODOS_FILE);
        this.nextId = this.todos.length > 0 ? Math.max(...this.todos.map(t => t.id)) + 1 : 1;
      } catch {
        this.todos = [];
      }
    }
  }

  async save(): Promise<void> {
    await fs.ensureDir(path.dirname(TODOS_FILE));
    await fs.writeJson(TODOS_FILE, this.todos, { spaces: 2 });
  }

  add(task: string): TodoItem {
    const item: TodoItem = {
      id: this.nextId++,
      task,
      done: false,
      createdAt: Date.now()
    };
    this.todos.push(item);
    this.save();
    return item;
  }

  list(): TodoItem[] {
    return [...this.todos];
  }

  done(id: number): TodoItem | null {
    const item = this.todos.find(t => t.id === id);
    if (item) {
      item.done = true;
      this.save();
    }
    return item || null;
  }

  remove(id: number): boolean {
    const idx = this.todos.findIndex(t => t.id === id);
    if (idx >= 0) {
      this.todos.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  clear(): void {
    this.todos = [];
    this.save();
  }
}

export const todoStore = new TodoStore();
