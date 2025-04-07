import { Component, HostListener } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { MenuItem, MessageService } from 'primeng/api';
import { BrowserModule } from '@angular/platform-browser';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SplitButtonModule } from 'primeng/splitbutton';
import { AvailabilityComponent } from '../availability/availability.component';
import { CalendarComponent } from '../calendar/calendar.component';
import { LoginComponent } from '../login/login.component';
import { AuthService } from '../../services/auth.service';
import { DialogModule } from 'primeng/dialog';
import { AddProfileComponent } from '../patients-section/edit-profile/add-profile.component';
import { ToastModule } from 'primeng/toast';
import { UserService } from '../../services/user.service';

interface NavItem {
  icon: string;
  label: string;
  link: string;
  hasAccess?: boolean;
}

@Component({
  selector: 'app-side-top-nav',
  templateUrl: './side-top-nav.component.html',
  styleUrl: './side-top-nav.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    ButtonModule,
    SplitButtonModule,
    ButtonModule,
    DialogModule,
    AddProfileComponent,
    ToastModule,
  ],
  providers: [MessageService]
})
export class SideTopNavComponent {
  allPatients: any[] = [];
  patients: any[] = [];
  filteredPatients: any[] = [];
  showSearchResults: boolean = false;
  loadPaitentsSubscriber: any;

  constructor(private authService: AuthService, private userService: UserService, private router: Router, private messageService: MessageService) {
    this.authService.getUser().subscribe(user => {
      this.user = user.data
      const privilegeNames = this.user.privileges.map((p: any) => p.name);
      this.addNavItems(privilegeNames);
      this.navItems = this.navItems.filter(nav => nav.hasAccess);
    });
    this.userService.loadPatients$.subscribe(_ => {
      this.getPatients();
    });
    this.getPatients();
  }

  displayAddPatientDialog = false;
  user: any;
  isExpanded = false;
  searchText: string = '';
  addPatientItems: MenuItem[] = [
    { label: 'Merge Patients', icon: 'pi pi-merge' }
  ];
  navItems: NavItem[] = [];
  addNavItems(privilegeNames: any[]) {
    this.navItems = [
      { icon: 'pi pi-calendar', label: 'Calendar', link: '/calendar', hasAccess: privilegeNames.includes("Calendar") },
      { icon: 'pi pi-users', label: 'Patients', link: '/patients', hasAccess: privilegeNames.includes("Patients") }
    ];
  }

  menuItems: MenuItem[] = [
    { label: 'Profile', icon: 'pi pi-user', command: () => this.viewProfile() },
    { label: 'Settings', icon: 'pi pi-cog', command: () => this.openSettings() },
    { separator: true },
    { label: 'Logout', icon: 'pi pi-sign-out', command: () => this.logout() }
  ];
  viewProfile() {
    console.log('View Profile clicked');
  }

  openSettings() {
    console.log('Settings clicked');
  }

  logout() {
    this.authService.logout();
  }

  showAddPatientDialog() {
    this.displayAddPatientDialog = true;
  }

  getPatients() {
    this.userService.getDoctors('2ac7787b-77d1-465b-9bc0-eee50933697f').subscribe(res => {
      this.allPatients = res.data;
      this.allPatients.forEach(patient => {
        this.patients.push({
          id: patient.unique_code,
          userId: patient.user_id,
          name: patient.first_name + ' ' + patient.last_name,
          email: patient.email,
          phone: patient.phone,
          image: 'assets/user.webp',
          gender: patient.gender
        })
        this.filteredPatients = [...this.patients]
      })
    })
  }

  savePatient($event: any) {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Patient Added Successfully' });
    this.displayAddPatientDialog = false;
    this.getPatients();
    this.router.navigate(['patients', $event.user_id, 'profile', $event.unique_code]);
  }

  hideAddPatientDialog() {
    this.displayAddPatientDialog = false;
  }
  filterPatients() {
    if (!this.searchText || this.searchText.trim() === '') {
      this.filteredPatients = [...this.patients];
    } else {
      const searchValue = this.searchText.toLowerCase().trim();
      this.filteredPatients = this.patients.filter(patient =>
        patient.name.toLowerCase().includes(searchValue) ||
        patient.email.toLowerCase().includes(searchValue) ||
        patient.phone.toLowerCase().includes(searchValue) ||
        patient.id.toLowerCase().includes(searchValue) ||
        (patient.manual_unique_code ? patient.manual_unique_code.toLowerCase().includes(searchValue) : false)
      );
    }
  }

  selectPatient(patient: any) {
    // You can handle what happens when a patient is selected here
    // For example, navigate to patient details page
    this.router.navigate(['patients', patient.userId, 'profile', patient.id]);
    this.searchText = ''; // Set search input to selected patient name
    this.showSearchResults = false; // Hide dropdown
    // Example: this.router.navigate(['/patients', patient.id]);
  }

  // Add this to handle clicking outside the dropdown
  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent) {
    const searchWrapper = document.querySelector('.search-wrapper');
    if (searchWrapper && !searchWrapper.contains(event.target as Node)) {
      this.showSearchResults = false;
    }
  }
}
