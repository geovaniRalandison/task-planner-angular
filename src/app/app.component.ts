import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Task {
  id: number;
  title: string;
  description: string;
  category: 'perso' | 'famille';
  dueDate: string;
  completed: boolean;
  priority: 'haute' | 'moyenne' | 'basse';
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  tasks: Task[] = JSON.parse(localStorage.getItem('tasks') || '[]');
  newTask: Partial<Task> = {
    title: '',
    description: '',
    category: 'perso',
    dueDate: this.formatDate(new Date()),
    priority: 'moyenne'
  };
  filterCategory: 'toutes' | 'perso' | 'famille' = 'toutes';
  filterPriority: 'toutes' | 'haute' | 'moyenne' | 'basse' = 'toutes';

  ngOnInit() {
    this.saveTasks();
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  addTask() {
    if (!this.newTask.title) return;
    const task: Task = {
      id: Date.now(),
      title: this.newTask.title!,
      description: this.newTask.description || '',
      category: this.newTask.category!,
      dueDate: this.newTask.dueDate!,
      completed: false,
      priority: this.newTask.priority!
    };
    this.tasks.push(task);
    this.saveTasks();
    this.resetForm();
  }

  resetForm() {
    this.newTask = {
      title: '',
      description: '',
      category: 'perso',
      dueDate: this.formatDate(new Date()),
      priority: 'moyenne'
    };
  }

  deleteTask(id: number) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveTasks();
  }

  toggleComplete(id: number) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
    }
  }

  saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }

  get filteredTasks(): Task[] {
    return this.tasks.filter(task => {
      const categoryMatch = this.filterCategory === 'toutes' || task.category === this.filterCategory;
      const priorityMatch = this.filterPriority === 'toutes' || task.priority === this.filterPriority;
      return categoryMatch && priorityMatch;
    });
  }

  get categoryCounts() {
    return {
      perso: this.tasks.filter(t => t.category === 'perso').length,
      famille: this.tasks.filter(t => t.category === 'famille').length
    };
  }

  get priorityCounts() {
    return {
      haute: this.tasks.filter(t => t.priority === 'haute').length,
      moyenne: this.tasks.filter(t => t.priority === 'moyenne').length,
      basse: this.tasks.filter(t => t.priority === 'basse').length
    };
  }
}