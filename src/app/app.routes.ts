import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { TaskPlannerComponent } from './components/task-planner/task-planner.component';
import { FamilyComponent } from './components/family/family.component';
import { CalendarPageComponent } from './components/calendar/calendar-page.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: TaskPlannerComponent, canActivate: [AuthGuard] },
  { path: 'family', component: FamilyComponent, canActivate: [AuthGuard] },
  { path: 'calendar', component: CalendarPageComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '**', redirectTo: '' }
];