import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, SessionUser } from '../../services/auth.service';
import { FamilyService, Family, Invitation } from '../../services/family.service';

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

  constructor(
    private authService: AuthService,
    private familyService: FamilyService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadData();
  }

  loadData() {
    if (!this.currentUser) {
      return;
    }
    this.families = this.familyService.getFamiliesForUser(this.currentUser.id);
    this.pendingInvitations = this.familyService.getPendingInvitationsForUser(this.currentUser.id);
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

  createFamily() {
    this.clearMessages();
    if (!this.currentUser) {
      return;
    }
    const result = this.familyService.createFamily(this.newFamilyName, this.currentUser.id);
    if (result.success) {
      this.newFamilyName = '';
    }
    this.showMessage(result.success ? result.message : '', result.success ? '' : result.message);
    this.loadData();
  }

  inviteMember(family: Family) {
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
    const result = this.familyService.inviteMember(family, this.currentUser, targetId);
    if (result.success) {
      this.inviteInputs[family.id] = '';
    }
    this.showMessage(result.success ? result.message : '', result.success ? '' : result.message);
    this.loadData();
  }

  respond(invitation: Invitation, accept: boolean) {
    this.clearMessages();
    const result = this.familyService.respondInvitation(invitation.id, accept);
    this.showMessage(result.success ? result.message : '', result.success ? '' : result.message);
    this.loadData();
  }

  leaveFamily(family: Family) {
    this.clearMessages();
    if (!this.currentUser) {
      return;
    }
    const result = this.familyService.leaveFamily(family.id, this.currentUser.id);
    this.showMessage(result.success ? result.message : '', result.success ? '' : result.message);
    this.loadData();
  }

  deleteFamily(family: Family) {
    this.clearMessages();
    if (!this.currentUser) {
      return;
    }
    const result = this.familyService.deleteFamily(family.id, this.currentUser.id);
    this.showMessage(result.success ? result.message : '', result.success ? '' : result.message);
    this.loadData();
  }

  isOwner(family: Family): boolean {
    return this.currentUser !== null && family.ownerId === this.currentUser.id;
  }

  getMembers(family: Family): { id: number; name: string; isOwner: boolean }[] {
    return family.memberIds.map(id => ({
      id: id,
      name: this.authService.getUserNameById(id) || 'Utilisateur inconnu',
      isOwner: id === family.ownerId
    }));
  }

  getPendingCountForFamily(family: Family): number {
    return this.familyService.getPendingInvitationsForFamily(family.id).length;
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