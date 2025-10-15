import { Component, HostListener, OnDestroy, ViewChild } from '@angular/core';
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
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';

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
export class SideTopNavComponent implements OnDestroy {
  @ViewChild(AddProfileComponent) addProfileComp?: AddProfileComponent;
  allPatients: any[] = [];
  patients: any[] = [];
  filteredPatients: any[] = [];
  showSearchResults: boolean = false;
  loadPaitentsSubscriber: any;
  isSearching: boolean = false;
  searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService, private userService: UserService, private router: Router, private messageService: MessageService) {
    this.authService.getUser().subscribe(user => {
      this.user = user.data
      const privilegeNames = this.user.privileges.map((p: any) => p.name);
      this.addNavItems(privilegeNames);
      this.navItems = this.navItems.filter(nav => nav.hasAccess);
    });
    
    this.userService.loadPatients$.subscribe(_ => {
      // No need to fetch all patients anymore, search will handle it
    });
    
    // Setup debounced search
    this.setupSearch();
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
      { icon: 'pi pi-users', label: 'Patients', link: '/patients', hasAccess: privilegeNames.includes("Patients") },
      { icon: 'pi pi-heart', label: 'SFC', link: '/sfc', hasAccess: true },
      { icon: 'pi pi-chart-bar', label: 'Reports', link: '/reports', hasAccess: true },
      { icon: 'pi pi-upload', label: 'Import', link: '/import', hasAccess: true },
    ];
  }

  menuItems: MenuItem[] = [
    { label: 'Profile', icon: 'pi pi-user', command: () => this.viewProfile() },
    // { label: 'Settings', icon: 'pi pi-cog', command: () => this.openSettings() },
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
  practices: any[] = [];

  setupSearch() {
    this.searchSubject.pipe(
      debounceTime(300), // Wait 300ms after user stops typing
      distinctUntilChanged(), // Only search if the search term has changed
      switchMap(searchTerm => {
        if (searchTerm && searchTerm.trim().length >= 2) {
          this.isSearching = true;
          return this.userService.searchPatients(searchTerm.trim(), 20);
        } else {
          this.filteredPatients = [];
          this.showSearchResults = false;
          return [];
        }
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.isSearching = false;
        if (response && response.data) {
          this.filteredPatients = response.data.map((patient: any) => ({
            id: patient.unique_code,
            userId: patient.user_id,
            name: patient.first_name + ' ' + patient.last_name,
            email: patient.email,
            phone: patient.phone,
            image: 'assets/user.webp',
            gender: patient.gender,
            manual_unique_code: patient.manual_unique_code
          }));
          this.showSearchResults = this.filteredPatients.length > 0;
        } else {
          this.filteredPatients = [];
          this.showSearchResults = false;
        }
      },
      error: (error) => {
        this.isSearching = false;
        console.error('Search error:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Search Error',
          detail: 'Failed to search patients. Please try again.'
        });
        this.filteredPatients = [];
        this.showSearchResults = false;
      }
    });
  }

  getPatients() {
    // This method is kept for compatibility but no longer fetches all patients
    // Search functionality now handles patient retrieval
    this.userService.getBranches().subscribe(res=>{
      this.practices = res.data;
      const savedPractice = localStorage.getItem('selectedPractice');
      if (savedPractice) {
      } else {
        localStorage.setItem('selectedPractice', JSON.stringify(this.practices[0]));
      }
    })
  }

  savePatient($event: any) {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Patient Added Successfully' });
    this.displayAddPatientDialog = false;
    this.getPatients();
    this.router.navigate(['patients', $event.user_id, 'profile', $event.unique_code]);
  }

  dialogClose() {
    console.log("closed");
    this.addProfileComp?.resetAllForms();
  }

  hideAddPatientDialog() {
    this.displayAddPatientDialog = false;
  }
  filterPatients() {
    if (!this.searchText || this.searchText.trim() === '') {
      this.filteredPatients = [];
      this.showSearchResults = false;
    } else {
      // Show search results dropdown immediately when user starts typing
      this.showSearchResults = true;
      // Trigger the search subject which will handle the API call
      this.searchSubject.next(this.searchText);
    }
  }

  selectPatient(patient: any) {
    // Open patient profile in a new tab/window
    const url = this.router.createUrlTree(['patients', patient.userId, 'profile', patient.id]);
    window.open(url.toString(), '_blank');
    
    // Clear search state
    this.searchText = ''; // Clear search input
    this.showSearchResults = false; // Hide dropdown
    this.filteredPatients = []; // Clear search results
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
