import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { TaskPlannerComponent } from './components/task-planner/task-planner.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: TaskPlannerComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '**', redirectTo: '' }
];