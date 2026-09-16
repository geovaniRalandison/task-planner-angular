import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CalTask {
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

export interface CalFamily {
  id: number;
  name: string;
}

interface DayColumn {
  date: Date;
  dateStr: string;
  dayNum: number;
  dayLabel: string;
  isToday: boolean;
  tasks: CalTask[];
}

@Component({
  selector: 'app-week-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnChanges {
  @Input() tasks: CalTask[] = [];
  @Input() families: CalFamily[] = [];
  @Input() showHeader = true;

  weekOffset = 0;
  weekDays: DayColumn[] = [];
  dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  constructor() {
    this.buildWeek();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tasks'] || changes['families']) {
      this.buildWeek();
    }
  }

  prevWeek() {
    this.weekOffset--;
    this.buildWeek();
  }

  nextWeek() {
    this.weekOffset++;
    this.buildWeek();
  }

  goToday() {
    this.weekOffset = 0;
    this.buildWeek();
  }

  get weekLabel(): string {
    if (this.weekDays.length === 0) return '';
    const first = this.weekDays[0].date;
    const last = this.weekDays[6].date;
    return first.getDate() + ' ' + this.monthNames[first.getMonth()] + ' – ' +
      last.getDate() + ' ' + this.monthNames[last.getMonth()] + ' ' + last.getFullYear();
  }

  get weekTaskCount(): number {
    return this.weekDays.reduce((sum, d) => sum + d.tasks.length, 0);
  }

  private buildWeek() {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + this.weekOffset * 7);

    const monday = new Date(base);
    const dow = (monday.getDay() + 6) % 7;
    monday.setDate(monday.getDate() - dow);

    const todayStr = this.toKey(new Date());
    const days: DayColumn[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      const key = this.toKey(d);
      days.push({
        date: d,
        dateStr: key,
        dayNum: d.getDate(),
        dayLabel: this.dayNames[i],
        isToday: key === todayStr,
        tasks: this.tasksForDate(key)
      });
    }
    this.weekDays = days;
  }

  private tasksForDate(dateKey: string): CalTask[] {
    return this.tasks.filter(t => (t.dueDate || '') === dateKey);
  }

  private toKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  getFamilyName(familyId: number | undefined): string {
    if (familyId === undefined || familyId === null) return '';
    const family = this.families.find(f => f.id === familyId);
    return family ? family.name : '';
  }

  isWeekend(day: DayColumn): boolean {
    const dow = day.date.getDay();
    return dow === 0 || dow === 6;
  }

  taskTitle(task: CalTask): string {
    let tip = task.title;
    if (task.description) tip += ' — ' + task.description;
    if (task.category === 'famille') {
      const fam = this.getFamilyName(task.familyId);
      if (fam) tip += ' (' + fam + ')';
    }
    return tip;
  }
}