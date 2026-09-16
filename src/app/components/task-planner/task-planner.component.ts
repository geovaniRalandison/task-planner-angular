import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService, SessionUser } from '../../services/auth.service';
import { FamilyService, Family } from '../../services/family.service';
import { DbService } from '../../services/db.service';
import { CalendarComponent } from '../calendar/calendar.component';
import { AddTaskDialogComponent, AddTaskDialogResult } from './add-task-dialog.component';

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
  imports: [CommonModule, FormsModule, RouterModule, CalendarComponent],
  templateUrl: './task-planner.component.html',
  styleUrls: ['./task-planner.component.scss']
})
export class TaskPlannerComponent implements OnInit {
  currentUser: SessionUser | null = null;
  families: Family[] = [];
  tasks: Task[] = [];
  filterCategory: 'toutes' | 'perso' | 'famille' = 'toutes';
  filterPriority: 'toutes' | 'haute' | 'moyenne' | 'basse' = 'toutes';

  constructor(
    private authService: AuthService,
    private familyService: FamilyService,
    private db: DbService,
    private router: Router,
    private dialog: MatDialog
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

  openAddTaskDialog() {
    const dialogRef = this.dialog.open<AddTaskDialogComponent, { id: number; name: string }[], AddTaskDialogResult>(
      AddTaskDialogComponent,
      {
        width: 'min(560px, calc(100vw - 40px))',
        maxWidth: 'calc(100vw - 40px)',
        autoFocus: 'first-tabbable',
        hasBackdrop: true,
        data: this.families
      }
    );
    dialogRef.afterClosed().subscribe(result => {
      if (result && this.currentUser) {
        this.addTask(result);
      }
    });
  }

  private async addTask(result: AddTaskDialogResult) {
    const task: Task = {
      id: Date.now(),
      title: result.title,
      description: result.description || '',
      category: result.category,
      dueDate: result.dueDate,
      completed: false,
      priority: result.priority,
      familyId: result.category === 'famille' ? result.familyId! : undefined,
      createdBy: result.category === 'famille' ? this.currentUser!.name : undefined
    };
    this.tasks.push(task);
    await this.saveTasks();
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