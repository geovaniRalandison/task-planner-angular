import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, SessionUser } from '../../services/auth.service';
import { FamilyService, Family } from '../../services/family.service';
import { DbService } from '../../services/db.service';

interface Task {
  id: number;
  title: string;
  description: string;
  category: 'perso' | 'famille';
  dueDate: string;
  completed: boolean;
  priority: 'haute' | 'moyenne' | 'basse';
  familyId?: number;
  createdBy?: string;
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
  families: Family[] = [];
  tasks: Task[] = [];
  newTask: Partial<Task> = {
    title: '',
    description: '',
    category: 'perso',
    dueDate: this.formatDate(new Date()),
    priority: 'moyenne'
  };
  selectedFamilyId: number | null = null;
  formError = '';
  filterCategory: 'toutes' | 'perso' | 'famille' = 'toutes';
  filterPriority: 'toutes' | 'haute' | 'moyenne' | 'basse' = 'toutes';

  constructor(
    private authService: AuthService,
    private familyService: FamilyService,
    private db: DbService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      return;
    }
    this.families = await this.familyService.getFamiliesForUser(this.currentUser.id);
    await this.loadTasks();
  }

  async loadTasks() {
    if (!this.currentUser) {
      return;
    }
    this.tasks = [];
    const personal: Task[] = await this.db.getLocalStorageItem<Task[]>('tasks_' + this.currentUser.id) || [];
    this.tasks.push(...personal.filter(t => t.category === 'perso'));
    for (const family of this.families) {
      const familyTasks: Task[] = await this.db.getLocalStorageItem<Task[]>('tasks_family_' + family.id) || [];
      this.tasks.push(...familyTasks);
    }
  }

  get hasFamilies(): boolean {
    return this.families.length > 0;
  }

  getFamilyName(familyId: number | undefined): string {
    if (familyId === undefined || familyId === null) {
      return '';
    }
    const family = this.families.find(f => f.id === familyId);
    return family ? family.name : 'Famille';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  async addTask() {
    this.formError = '';
    if (!this.newTask.title || !this.currentUser) {
      return;
    }
    if (this.newTask.category === 'famille' && !this.selectedFamilyId) {
      this.formError = 'Sélectionnez une famille pour cette tâche (ou créez-en une).';
      return;
    }
    const task: Task = {
      id: Date.now(),
      title: this.newTask.title!,
      description: this.newTask.description || '',
      category: this.newTask.category!,
      dueDate: this.newTask.dueDate!,
      completed: false,
      priority: this.newTask.priority!,
      familyId: this.newTask.category === 'famille' ? this.selectedFamilyId! : undefined,
      createdBy: this.newTask.category === 'famille' ? this.currentUser.name : undefined
    };
    this.tasks.push(task);
    await this.saveTasks();
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

  async deleteTask(id: number) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    await this.saveTasks();
  }

  async toggleComplete(id: number) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      await this.saveTasks();
    }
  }

  async saveTasks() {
    if (!this.currentUser) {
      return;
    }
    await this.db.setLocalStorageItem(
      'tasks_' + this.currentUser.id,
      this.tasks.filter(t => t.category === 'perso')
    );
    for (const family of this.families) {
      await this.db.setLocalStorageItem(
        'tasks_family_' + family.id,
        this.tasks.filter(t => t.familyId === family.id)
      );
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