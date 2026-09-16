import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  template: '<router-outlet></router-outlet><footer class="app-version">v1.3.0 · Calendrier hebdomadaire maison</footer>',
  styles: ['.app-version { text-align: center; color: #95a5a6; font-size: 0.8em; padding: 15px 0; }']
})
export class AppComponent {}