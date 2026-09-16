import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
  private currentUserSubject = new BehaviorSubject<SessionUser | null>(this.getUserFromStorage());
  currentUser$ = this.currentUserSubject.asObservable();

  private hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private getUsers(): User[] {
    return JSON.parse(localStorage.getItem('app_users') || '[]');
  }

  private saveUsers(users: User[]) {
    localStorage.setItem('app_users', JSON.stringify(users));
  }

  private getUserFromStorage(): SessionUser | null {
    const session = localStorage.getItem('app_session');
    return session ? JSON.parse(session) : null;
  }

  register(name: string, email: string, password: string): { success: boolean; message: string } {
    const users = this.getUsers();
    
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
    this.saveUsers(users);
    
    this.login(email, password);
    return { success: true, message: 'Compte créé avec succès !' };
  }

  login(email: string, password: string): { success: boolean; message: string } {
    const users = this.getUsers();
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

    localStorage.setItem('app_session', JSON.stringify(sessionUser));
    this.currentUserSubject.next(sessionUser);
    return { success: true, message: 'Connexion réussie !' };
  }

  logout() {
    localStorage.removeItem('app_session');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return this.getUserFromStorage() !== null;
  }

  getCurrentUser(): SessionUser | null {
    return this.getUserFromStorage();
  }

  userExists(id: number): boolean {
    return this.getUsers().some(u => u.id === id);
  }

  getUserNameById(id: number): string | null {
    const user = this.getUsers().find(u => u.id === id);
    return user ? user.name : null;
  }
}