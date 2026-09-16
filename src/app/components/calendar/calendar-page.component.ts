import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CalendarComponent, CalTask } from './calendar.component';
import { AuthService, SessionUser } from '../../services/auth.service';
import { FamilyService, Family } from '../../services/family.service';
import { DbService } from '../../services/db.service';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [CommonModule, RouterModule, CalendarComponent],
  template: `
    <div class="app-container">
      <header>
        <h1><i class="fas fa-calendar-week"></i> Calendrier</h1>
        <p class="subtitle">Vue hebdomadaire de vos tâches</p>
        <nav class="app-nav">
          <a routerLink="/" routerLinkActive="active"><i class="fas fa-list"></i> Tâches</a>
          <a routerLink="/family" routerLinkActive="active"><i class="fas fa-users"></i> Familles</a>
          <a routerLink="/calendar" routerLinkActive="active"><i class="fas fa-calendar-week"></i> Calendrier</a>
        </nav>
      </header>
      <app-week-calendar [tasks]="tasks" [families]="families"></app-week-calendar>
    </div>
  `,
  styles: [`
    header { text-align: center; margin-bottom: 30px; }
    h1 { color: #2c3e50; font-size: 2.2em; margin-bottom: 5px; }
    h1 i { margin-right: 10px; color: #667eea; }
    .subtitle { color: #7f8c8d; font-size: 1.1em; }
    .app-nav { display: flex; justify-content: center; gap: 15px; margin-top: 15px; flex-wrap: wrap; }
    .app-nav a {
      display: flex; align-items: center; gap: 6px; padding: 10px 20px;
      background: #f8f9fa; border-radius: 8px; color: #2c3e50;
      text-decoration: none; font-weight: 500; transition: all 0.2s;
    }
    .app-nav a:hover { background: #e9ecef; transform: translateY(-2px); }
    .app-nav a.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .app-nav a i { color: #667eea; }
    .app-nav a.active i { color: white; }
  `]
})
export class CalendarPageComponent implements OnInit {
  currentUser: SessionUser | null = null;
  families: Family[] = [];
  tasks: CalTask[] = [];

  constructor(
    private authService: AuthService,
    private familyService: FamilyService,
    private db: DbService
  ) {}

  async ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) return;
    this.families = await this.familyService.getFamiliesForUser(this.currentUser.id);
    this.tasks = [];
    const personal: CalTask[] = await this.db.getLocalStorageItem<CalTask[]>('tasks_' + this.currentUser.id) || [];
    this.tasks.push(...personal);
    for (const family of this.families) {
      const familyTasks: CalTask[] = await this.db.getLocalStorageItem<CalTask[]>('tasks_family_' + family.id) || [];
      this.tasks.push(...familyTasks);
    }
  }
}
