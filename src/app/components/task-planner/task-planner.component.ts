import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, SessionUser } from '../../services/auth.service';

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
  selector: 'app-task-planner',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './task-planner.component.html',
  styleUrls: ['./task-planner.component.scss']
})
export class TaskPlannerComponent implements OnInit {
  currentUser: SessionUser | null = null;
  tasks: Task[] = [];
  newTask: Partial<Task> = {
    title: '',
    description: '',
    category: 'perso',
    dueDate: this.formatDate(new Date()),
    priority: 'moyenne'
  };
  filterCategory: 'toutes' | 'perso' | 'famille' = 'toutes';
  filterPriority: 'toutes' | 'haute' | 'moyenne' | 'basse' = 'toutes';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) return;
    this.tasks = JSON.parse(localStorage.getItem('tasks_' + this.currentUser.id) || '[]');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
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
    if (this.currentUser) {
      localStorage.setItem('tasks_' + this.currentUser.id, JSON.stringify(this.tasks));
    }
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

  get completedCount() {
    return this.tasks.filter(t => t.completed).length;
  }
}