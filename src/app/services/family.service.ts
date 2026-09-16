import { Injectable } from '@angular/core';
import { AuthService, SessionUser } from './auth.service';

export interface Family {
  id: number;
  name: string;
  ownerId: number;
  memberIds: number[];
  createdAt: string;
}

export interface Invitation {
  id: number;
  familyId: number;
  familyName: string;
  fromUserId: number;
  fromUserName: string;
  toUserId: number;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface Result {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class FamilyService {

  constructor(private authService: AuthService) {}

  private getFamilies(): Family[] {
    try {
      return JSON.parse(localStorage.getItem('app_families') || '[]');
    } catch {
      return [];
    }
  }

  private saveFamilies(families: Family[]) {
    localStorage.setItem('app_families', JSON.stringify(families));
  }

  private getInvitations(): Invitation[] {
    try {
      return JSON.parse(localStorage.getItem('app_invitations') || '[]');
    } catch {
      return [];
    }
  }

  private saveInvitations(invitations: Invitation[]) {
    localStorage.setItem('app_invitations', JSON.stringify(invitations));
  }

  getFamiliesForUser(userId: number): Family[] {
    return this.getFamilies().filter(f => f.memberIds.includes(userId));
  }

  getPendingInvitationsForUser(userId: number): Invitation[] {
    return this.getInvitations().filter(i => i.toUserId === userId && i.status === 'pending');
  }

  getPendingInvitationsForFamily(familyId: number): Invitation[] {
    return this.getInvitations().filter(i => i.familyId === familyId && i.status === 'pending');
  }

  createFamily(name: string, ownerId: number): Result {
    if (!name.trim()) {
      return { success: false, message: 'Veuillez saisir un nom de famille.' };
    }
    const families = this.getFamilies();
    const family: Family = {
      id: Date.now(),
      name: name.trim(),
      ownerId: ownerId,
      memberIds: [ownerId],
      createdAt: new Date().toISOString()
    };
    families.push(family);
    this.saveFamilies(families);
    return { success: true, message: 'Famille créée avec succès !' };
  }

  inviteMember(family: Family, fromUser: SessionUser, targetUserId: number): Result {
    if (targetUserId === fromUser.id) {
      return { success: false, message: 'Vous ne pouvez pas vous inviter vous-même.' };
    }
    if (!this.authService.userExists(targetUserId)) {
      return { success: false, message: 'Aucun utilisateur trouvé avec cet identifiant.' };
    }
    const families = this.getFamilies();
    const target = families.find(f => f.id === family.id);
    if (!target) {
      return { success: false, message: 'Famille introuvable.' };
    }
    if (target.memberIds.includes(targetUserId)) {
      return { success: false, message: 'Cet utilisateur est déjà membre de la famille.' };
    }
    const invitations = this.getInvitations();
    const existing = invitations.find(
      i => i.familyId === family.id && i.toUserId === targetUserId && i.status === 'pending'
    );
    if (existing) {
      return { success: false, message: 'Une invitation est déjà en attente pour cet utilisateur.' };
    }
    invitations.push({
      id: Date.now(),
      familyId: family.id,
      familyName: target.name,
      fromUserId: fromUser.id,
      fromUserName: fromUser.name,
      toUserId: targetUserId,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    this.saveInvitations(invitations);
    return { success: true, message: 'Invitation envoyée !' };
  }

  respondInvitation(invitationId: number, accept: boolean): Result {
    const invitations = this.getInvitations();
    const invitation = invitations.find(i => i.id === invitationId && i.status === 'pending');
    if (!invitation) {
      return { success: false, message: 'Invitation introuvable ou déjà traitée.' };
    }
    if (accept) {
      const families = this.getFamilies();
      const family = families.find(f => f.id === invitation.familyId);
      if (!family) {
        return { success: false, message: 'Famille introuvable.' };
      }
      if (!family.memberIds.includes(invitation.toUserId)) {
        family.memberIds.push(invitation.toUserId);
        this.saveFamilies(families);
      }
      invitation.status = 'accepted';
      this.saveInvitations(invitations);
      return { success: true, message: 'Vous avez rejoint la famille « ' + invitation.familyName + ' » !' };
    } else {
      invitation.status = 'declined';
      this.saveInvitations(invitations);
      return { success: true, message: 'Invitation refusée.' };
    }
  }

  leaveFamily(familyId: number, userId: number): Result {
    const families = this.getFamilies();
    const family = families.find(f => f.id === familyId);
    if (!family) {
      return { success: false, message: 'Famille introuvable.' };
    }
    if (family.ownerId === userId) {
      return { success: false, message: 'Le propriétaire ne peut pas quitter la famille. Il peut la supprimer.' };
    }
    family.memberIds = family.memberIds.filter(id => id !== userId);
    this.saveFamilies(families);
    return { success: true, message: 'Vous avez quitté la famille.' };
  }

  deleteFamily(familyId: number, userId: number): Result {
    const families = this.getFamilies();
    const family = families.find(f => f.id === familyId);
    if (!family) {
      return { success: false, message: 'Famille introuvable.' };
    }
    if (family.ownerId !== userId) {
      return { success: false, message: 'Seul le propriétaire peut supprimer la famille.' };
    }
    this.saveFamilies(families.filter(f => f.id !== familyId));
    this.saveInvitations(this.getInvitations().filter(i => i.familyId !== familyId));
    return { success: true, message: 'Famille supprimée.' };
  }
}