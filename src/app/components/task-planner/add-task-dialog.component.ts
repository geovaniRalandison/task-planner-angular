import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface AddTaskDialogResult {
  title: string;
  description: string;
  category: 'perso' | 'famille';
  dueDate: string;
  priority: 'haute' | 'moyenne' | 'basse';
  familyId: number | null;
}

@Component({
  selector: 'app-add-task-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title class="dialog-head">
      <span><i class="fas fa-plus-circle"></i> Ajouter une tâche</span>
      <button class="dialog-close" mat-dialog-close aria-label="Fermer">
        <i class="fas fa-times"></i>
      </button>
    </h2>

    <div mat-dialog-content>
      <form id="taskForm" (ngSubmit)="submit()">
        <div class="form-row">
          <div class="form-group">
            <label>Titre *</label>
            <input type="text" [(ngModel)]="title" name="title" placeholder="Ex: Faire les courses" required autofocus>
          </div>
          <div class="form-group">
            <label>Date limite</label>
            <input type="date" [(ngModel)]="dueDate" name="dueDate">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Description</label>
            <textarea [(ngModel)]="description" name="description" placeholder="Détails..."></textarea>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Catégorie</label>
            <select [(ngModel)]="category" name="category">
              <option value="perso">Personnel</option>
              <option value="famille">Famille (partagée)</option>
            </select>
          </div>
          <div class="form-group" *ngIf="category === 'famille'">
            <label>Famille *</label>
            <select [(ngModel)]="familyId" name="family" [disabled]="families.length === 0">
              <option [ngValue]="null" disabled>Choisir une famille</option>
              <option *ngFor="let f of families" [ngValue]="f.id">{{ f.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Priorité</label>
            <select [(ngModel)]="priority" name="priority">
              <option value="haute">Haute</option>
              <option value="moyenne">Moyenne</option>
              <option value="basse">Basse</option>
            </select>
          </div>
        </div>

        <p class="no-family-hint" *ngIf="category === 'famille' && families.length === 0">
          Vous n'êtes membre d'aucune famille.
        </p>
        <div *ngIf="error" class="form-error">{{ error }}</div>
      </form>
    </div>

    <div mat-dialog-actions align="end">
      <button type="button" class="btn-cancel" mat-dialog-close>Annuler</button>
      <button type="submit" class="btn-add" form="taskForm" [disabled]="!title">
        <i class="fas fa-plus"></i> Ajouter
      </button>
    </div>
  `,
  styles: [`
    .dialog-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .dialog-head span {
      color: #2c3e50;
      font-size: 1.3em;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dialog-head span i { color: #667eea; }
    .dialog-close {
      background: #f8f9fa;
      border: none;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      cursor: pointer;
      color: #7f8c8d;
      font-size: 0.9em;
      transition: all 0.2s;
    }
    .dialog-close:hover { background: #ffebee; color: #c62828; }
    .form-row { display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; }
    .form-group { flex: 1; min-width: 180px; }
    .form-group label {
      display: block;
      margin-bottom: 6px;
      color: #2c3e50;
      font-weight: 500;
      font-size: 0.9em;
    }
    .form-group input, .form-group textarea, .form-group select {
      width: 100%;
      padding: 11px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1em;
      font-family: inherit;
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    .form-group textarea { min-height: 70px; resize: vertical; }
    .no-family-hint { color: #e67e22; font-size: 0.85em; margin-bottom: 10px; }
    .form-error {
      background: #ffebee;
      color: #c62828;
      padding: 10px;
      border-radius: 8px;
      margin-bottom: 15px;
      font-size: 0.9em;
    }
    .btn-cancel {
      background: #f8f9fa;
      border: 2px solid #e0e0e0;
      padding: 11px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      color: #2c3e50;
      transition: all 0.2s;
    }
    .btn-cancel:hover { background: #e9ecef; }
    .btn-add {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 11px 25px;
      border-radius: 8px;
      font-size: 1em;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn-add:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4); }
    .btn-add:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class AddTaskDialogComponent {
  title = '';
  description = '';
  category: 'perso' | 'famille' = 'perso';
  dueDate: string;
  priority: 'haute' | 'moyenne' | 'basse' = 'moyenne';
  familyId: number | null = null;
  error = '';

  constructor(
    public dialogRef: MatDialogRef<AddTaskDialogComponent, AddTaskDialogResult>,
    @Inject(MAT_DIALOG_DATA) public families: { id: number; name: string }[]
  ) {
    this.dueDate = this.formatDate(new Date());
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  cancel() {
    this.dialogRef.close();
  }

  submit() {
    this.error = '';
    if (!this.title.trim()) {
      this.error = 'Le titre est obligatoire.';
      return;
    }
    if (this.category === 'famille' && !this.familyId) {
      this.error = 'Sélectionnez une famille pour cette tâche (ou créez-en une).';
      return;
    }
    this.dialogRef.close({
      title: this.title.trim(),
      description: this.description,
      category: this.category,
      dueDate: this.dueDate,
      priority: this.priority,
      familyId: this.familyId
    });
  }
}
