import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { AppointmentComponent } from './components/appointment/appointment.component';
import { AvailabilityComponent } from './components/availability/availability.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import { LoginComponent } from './components/login/login.component';
import { MenuItem } from 'primeng/api';
import { BrowserModule } from '@angular/platform-browser';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SplitButtonModule } from 'primeng/splitbutton';
import { SideTopNavComponent } from './components/side-top-nav/side-top-nav.component';
import { PatientsSectionComponent } from './components/patients-section/patients-section.component';
import { AuthService } from './services/auth.service';
import { HomeComponent } from './components/home/home.component';

interface NavItem {
  icon: string;
  label: string;
  link: string;
  hasSubmenu?: boolean;
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports:[ 
    RouterOutlet, 
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    ButtonModule,
    SplitButtonModule,
    ButtonModule,
  ],
})
export class AppComponent {
  constructor(){}
  isExpanded = false;
  searchText: string = '';
}
