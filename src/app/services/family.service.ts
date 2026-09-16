import { Injectable } from '@angular/core';
import { AuthService, SessionUser } from './auth.service';
import { DbService } from './db.service';

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

  constructor(private authService: AuthService, private db: DbService) {}

  private async getFamilies(): Promise<Family[]> {
    const families = await this.db.getLocalStorageItem<Family[]>('app_families');
    return families || [];
  }

  private async saveFamilies(families: Family[]): Promise<void> {
    await this.db.setLocalStorageItem('app_families', families);
  }

  private async getInvitations(): Promise<Invitation[]> {
    const invitations = await this.db.getLocalStorageItem<Invitation[]>('app_invitations');
    return invitations || [];
  }

  private async saveInvitations(invitations: Invitation[]): Promise<void> {
    await this.db.setLocalStorageItem('app_invitations', invitations);
  }

  async getFamiliesForUser(userId: number): Promise<Family[]> {
    const families = await this.getFamilies();
    return families.filter(f => f.memberIds.includes(userId));
  }

  async getPendingInvitationsForUser(userId: number): Promise<Invitation[]> {
    const invitations = await this.getInvitations();
    return invitations.filter(i => i.toUserId === userId && i.status === 'pending');
  }

  async getPendingInvitationsForFamily(familyId: number): Promise<Invitation[]> {
    const invitations = await this.getInvitations();
    return invitations.filter(i => i.familyId === familyId && i.status === 'pending');
  }

  async createFamily(name: string, ownerId: number): Promise<Result> {
    if (!name.trim()) {
      return { success: false, message: 'Veuillez saisir un nom de famille.' };
    }
    const families = await this.getFamilies();
    const family: Family = {
      id: Date.now(),
      name: name.trim(),
      ownerId: ownerId,
      memberIds: [ownerId],
      createdAt: new Date().toISOString()
    };
    families.push(family);
    await this.saveFamilies(families);
    return { success: true, message: 'Famille créée avec succès !' };
  }

  async inviteMember(family: Family, fromUser: SessionUser, targetUserId: number): Promise<Result> {
    if (targetUserId === fromUser.id) {
      return { success: false, message: 'Vous ne pouvez pas vous inviter vous-même.' };
    }
    if (!(await this.authService.userExists(targetUserId))) {
      return { success: false, message: 'Aucun utilisateur trouvé avec cet identifiant.' };
    }
    const families = await this.getFamilies();
    const target = families.find(f => f.id === family.id);
    if (!target) {
      return { success: false, message: 'Famille introuvable.' };
    }
    if (target.memberIds.includes(targetUserId)) {
      return { success: false, message: 'Cet utilisateur est déjà membre de la famille.' };
    }
    const invitations = await this.getInvitations();
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
    await this.saveInvitations(invitations);
    return { success: true, message: 'Invitation envoyée !' };
  }

  async respondInvitation(invitationId: number, accept: boolean): Promise<Result> {
    const invitations = await this.getInvitations();
    const invitation = invitations.find(i => i.id === invitationId && i.status === 'pending');
    if (!invitation) {
      return { success: false, message: 'Invitation introuvable ou déjà traitée.' };
    }
    if (accept) {
      const families = await this.getFamilies();
      const family = families.find(f => f.id === invitation.familyId);
      if (!family) {
        return { success: false, message: 'Famille introuvable.' };
      }
      if (!family.memberIds.includes(invitation.toUserId)) {
        family.memberIds.push(invitation.toUserId);
        await this.saveFamilies(families);
      }
      invitation.status = 'accepted';
      await this.saveInvitations(invitations);
      return { success: true, message: 'Vous avez rejoint la famille « ' + invitation.familyName + ' » !' };
    } else {
      invitation.status = 'declined';
      await this.saveInvitations(invitations);
      return { success: true, message: 'Invitation refusée.' };
    }
  }

  async leaveFamily(familyId: number, userId: number): Promise<Result> {
    const families = await this.getFamilies();
    const family = families.find(f => f.id === familyId);
    if (!family) {
      return { success: false, message: 'Famille introuvable.' };
    }
    if (family.ownerId === userId) {
      return { success: false, message: 'Le propriétaire ne peut pas quitter la famille. Il peut la supprimer.' };
    }
    family.memberIds = family.memberIds.filter(id => id !== userId);
    await this.saveFamilies(families);
    return { success: true, message: 'Vous avez quitté la famille.' };
  }

  async deleteFamily(familyId: number, userId: number): Promise<Result> {
    const families = await this.getFamilies();
    const family = families.find(f => f.id === familyId);
    if (!family) {
      return { success: false, message: 'Famille introuvable.' };
    }
    if (family.ownerId !== userId) {
      return { success: false, message: 'Seul le propriétaire peut supprimer la famille.' };
    }
    await this.saveFamilies(families.filter(f => f.id !== familyId));
    await this.saveInvitations((await this.getInvitations()).filter(i => i.familyId !== familyId));
    return { success: true, message: 'Famille supprimée.' };
  }
}