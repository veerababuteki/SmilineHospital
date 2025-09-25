import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { SideTopNavComponent } from "../side-top-nav/side-top-nav.component";
import { LoaderService } from "../../services/loader.service";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet, SideTopNavComponent, CommonModule],
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
export class HomeComponent {
  isLoading: boolean = false;
  constructor() {

  }
}