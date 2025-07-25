import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SplitButtonModule } from 'primeng/splitbutton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { LoaderService } from './services/loader.service';
import { AuthService } from './services/auth.service';
import { LoginComponent } from './components/login/login.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    RouterOutlet,
    InputTextModule,
    ButtonModule,
    SplitButtonModule,
    ProgressSpinnerModule,
    LoginComponent
  ]
})
export class AppComponent implements OnInit {
  isLoading: boolean = false;

  constructor(
    public authService: AuthService, // 👈 Used in HTML with *ngIf
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    this.loaderService.isLoading$.subscribe(loading => {
      this.isLoading = loading;
    });
  }
}
