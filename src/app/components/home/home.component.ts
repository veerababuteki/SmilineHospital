import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { SideTopNavComponent } from "../side-top-nav/side-top-nav.component";

@Component({
    selector: 'app-home',
    imports: [RouterOutlet, SideTopNavComponent],
    template: `
      <app-side-top-nav></app-side-top-nav>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    `,
    styles: [`
        .main-content {
          margin-left: 60px;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `]
  })
  export class HomeComponent {}