import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DbService } from './db.service';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface SessionUser {
  id: number;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<SessionUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private db: DbService) {
    this.loadUserFromStorage();
  }

  private async loadUserFromStorage(): Promise<void> {
    const session = await this.db.getLocalStorageItem<SessionUser>('app_session');
    this.currentUserSubject.next(session || null);
  }

  private hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private async getUsers(): Promise<User[]> {
    const users = await this.db.getLocalStorageItem<User[]>('app_users');
    return users || [];
  }

  private async saveUsers(users: User[]): Promise<void> {
    await this.db.setLocalStorageItem('app_users', users);
  }

  async register(name: string, email: string, password: string): Promise<{ success: boolean; message: string }> {
    const users = await this.getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, message: 'Un compte existe déjà avec cet email.' };
    }

    const newUser: User = {
      id: Date.now(),
      name,
      email,
      password: this.hashPassword(password),
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await this.saveUsers(users);
    await this.login(email, password);
    return { success: true, message: 'Compte créé avec succès !' };
  }

  async login(email: string, password: string): Promise<{ success: boolean; message: string }> {
    const users = await this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { success: false, message: 'Aucun compte trouvé avec cet email.' };
    }

    if (user.password !== this.hashPassword(password)) {
      return { success: false, message: 'Mot de passe incorrect.' };
    }

    const sessionUser: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    await this.db.setLocalStorageItem('app_session', sessionUser);
    this.currentUserSubject.next(sessionUser);
    return { success: true, message: 'Connexion réussie !' };
  }

  async logout(): Promise<void> {
    await this.db.removeLocalStorageItem('app_session');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): SessionUser | null {
    return this.currentUserSubject.value;
  }

  async userExists(id: number): Promise<boolean> {
    const users = await this.getUsers();
    return users.some(u => u.id === id);
  }

  async getUserNameById(id: number): Promise<string | null> {
    const users = await this.getUsers();
    const user = users.find(u => u.id === id);
    return user ? user.name : null;
  }
}