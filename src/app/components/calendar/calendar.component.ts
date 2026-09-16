import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
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
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  @ViewChild(FullCalendarComponent) calendarComponent!: FullCalendarComponent;
  
  currentUser: SessionUser | null = null;
  families: Family[] = [];
  tasks: Task[] = [];
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridWeek',
    plugins: [dayGridPlugin],
    locale: 'fr',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridWeek,dayGridMonth'
    },
    events: [],
    eventClassNames: (arg) => {
      const task = this.tasks.find(t => t.id.toString() === arg.event.id);
      if (!task) return [];
      const classes: string[] = [task.category];
      if (task.completed) classes.push('fc-completed');
      classes.push('fc-priority-' + task.priority);
      return classes;
    },
    eventDidMount: (arg) => {
      const task = this.tasks.find(t => t.id.toString() === arg.event.id);
      if (task && task.category === 'famille') {
        const family = this.families.find(f => f.id === task.familyId);
        const familyName = family ? family.name : 'Famille';
        const title = task.title + (task.createdBy ? ` (${task.createdBy})` : '');
        arg.el.querySelector('.fc-event-title')!.textContent = title;
        arg.el.setAttribute('title', `${familyName}: ${task.description || ''}`);
      }
    }
  };

  constructor(
    private authService: AuthService,
    private familyService: FamilyService,
    private db: DbService
  ) {}

  async ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      return;
    }
    this.families = await this.familyService.getFamiliesForUser(this.currentUser.id);
    await this.loadTasks();
    this.updateCalendarEvents();
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

  updateCalendarEvents() {
    const events: EventInput[] = this.tasks
      .filter(task => task.dueDate && task.dueDate.trim())
      .map(task => ({
        id: task.id.toString(),
        title: task.title,
        date: task.dueDate,
        display: 'block',
        backgroundColor: this.getEventColor(task),
        borderColor: this.getEventColor(task)
      }));
    
    this.calendarOptions = {
      ...this.calendarOptions,
      events: events
    };
    
    // Force refresh if calendar is already initialized
    if (this.calendarComponent) {
      setTimeout(() => {
        const api = this.calendarComponent.getApi();
        if (api) {
          api.refetchEvents();
        }
      }, 0);
    }
  }

  getEventColor(task: Task): string {
    if (task.category === 'famille') {
      return '#3498db';
    }
    switch (task.priority) {
      case 'haute': return '#e74c3c';
      case 'moyenne': return '#f39c12';
      default: return '#2ecc71';
    }
  }

  getFamilyName(familyId: number | undefined): string {
    if (familyId === undefined) return '';
    const family = this.families.find(f => f.id === familyId);
    return family ? family.name : 'Famille';
  }
}