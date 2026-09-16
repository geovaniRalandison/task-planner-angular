import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, SessionUser } from '../../services/auth.service';
import { FamilyService, Family, Invitation } from '../../services/family.service';

interface MemberInfo {
  id: number;
  name: string;
  isOwner: boolean;
}

@Component({
  selector: 'app-family',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './family.component.html',
  styleUrls: ['./family.component.scss']
})
export class FamilyComponent implements OnInit {
  currentUser: SessionUser | null = null;
  families: Family[] = [];
  pendingInvitations: Invitation[] = [];
  newFamilyName = '';
  inviteInputs: { [familyId: number]: string } = {};
  errorMessage = '';
  successMessage = '';
  familyMembers: { [familyId: number]: MemberInfo[] } = {};
  familyPendingCounts: { [familyId: number]: number } = {};

  constructor(
    private authService: AuthService,
    private familyService: FamilyService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    await this.loadData();
  }

  async loadData() {
    if (!this.currentUser) {
      return;
    }
    this.families = await this.familyService.getFamiliesForUser(this.currentUser.id);
    this.pendingInvitations = await this.familyService.getPendingInvitationsForUser(this.currentUser.id);
    await this.loadFamilyDetails();
  }

  async loadFamilyDetails() {
    for (const family of this.families) {
      this.familyMembers[family.id] = await this.getMembers(family);
      this.familyPendingCounts[family.id] = await this.getPendingCountForFamily(family);
    }
  }

  copyId() {
    if (!this.currentUser) {
      return;
    }
    const id = String(this.currentUser.id);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(id).then(() => {
        this.showMessage('Identifiant copié !', '');
      }).catch(() => {
        this.showMessage('', 'Copie impossible. Votre identifiant : ' + id);
      });
    } else {
      this.showMessage('', 'Votre identifiant : ' + id);
    }
  }

  async createFamily() {
    this.clearMessages();
    if (!this.currentUser) {
      return;
    }
    const result = await this.familyService.createFamily(this.newFamilyName, this.currentUser.id);
    if (result.success) {
      this.newFamilyName = '';
    }
    this.showMessage(result.success ? result.message : '', result.success ? '' : result.message);
    await this.loadData();
  }

  async inviteMember(family: Family) {
    this.clearMessages();
    if (!this.currentUser) {
      return;
    }
    const input = this.inviteInputs[family.id] || '';
    const targetId = Number(input);
    if (!input || isNaN(targetId)) {
      this.showMessage('', 'Veuillez saisir un identifiant valide (chiffres uniquement).');
      return;
    }
    const result = await this.familyService.inviteMember(family, this.currentUser, targetId);
    if (result.success) {
      this.inviteInputs[family.id] = '';
    }
    this.showMessage(result.success ? result.message : '', result.success ? '' : result.message);
    await this.loadData();
  }

  async respond(invitation: Invitation, accept: boolean) {
    this.clearMessages();
    const result = await this.familyService.respondInvitation(invitation.id, accept);
    this.showMessage(result.success ? result.message : '', result.success ? '' : result.message);
    await this.loadData();
  }

  async leaveFamily(family: Family) {
    this.clearMessages();
    if (!this.currentUser) {
      return;
    }
    const result = await this.familyService.leaveFamily(family.id, this.currentUser.id);
    this.showMessage(result.success ? result.message : '', result.success ? '' : result.message);
    await this.loadData();
  }

  async deleteFamily(family: Family) {
    this.clearMessages();
    if (!this.currentUser) {
      return;
    }
    const result = await this.familyService.deleteFamily(family.id, this.currentUser.id);
    this.showMessage(result.success ? result.message : '', result.success ? '' : result.message);
    await this.loadData();
  }

  isOwner(family: Family): boolean {
    return this.currentUser !== null && family.ownerId === this.currentUser.id;
  }

  getMembers(family: Family): MemberInfo[] {
    return this.familyMembers[family.id] || [];
  }

  getPendingCountForFamily(family: Family): number {
    return this.familyPendingCounts[family.id] || 0;
  }

  async refreshFamilyDetails(family: Family) {
    this.familyMembers[family.id] = await this.loadMembers(family);
    this.familyPendingCounts[family.id] = await this.getPendingCount(family);
  }

  private async loadMembers(family: Family): Promise<MemberInfo[]> {
    return Promise.all(
      family.memberIds.map(async id => ({
        id: id,
        name: (await this.authService.getUserNameById(id)) || 'Utilisateur inconnu',
        isOwner: id === family.ownerId
      }))
    );
  }

  private async getPendingCount(family: Family): Promise<number> {
    const invitations = await this.familyService.getPendingInvitationsForFamily(family.id);
    return invitations.length;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  showMessage(success: string, error: string) {
    this.successMessage = success;
    this.errorMessage = error;
  }

  clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }
}