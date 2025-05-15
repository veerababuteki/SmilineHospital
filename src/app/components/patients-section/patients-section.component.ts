import { Component, ElementRef, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { ActivatedRoute, Router, RouterModule, RouterOutlet } from '@angular/router';
import { MessageService } from '../../services/message.service';
import { AuthService } from '../../services/auth.service';
import { AppointmentService } from '../../services/appointment.service';
import { UserService } from '../../services/user.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ClinicalNotesService } from '../../services/clinical-notes.service';
import { TreatmentPlansService } from '../../services/treatment-plans.service';
import { FileService } from '../../services/file.service';

@Component({
  selector: 'app-patients-section',
  templateUrl: './patients-section.component.html',
  styleUrls: ['./patients-section.component.scss'],
  standalone: true,
  imports: [ 
    CommonModule, 
    RouterOutlet,
    RouterModule, 
    FormsModule,
    ReactiveFormsModule,
    CalendarModule,
    DropdownModule,
    ButtonModule,
    RadioButtonModule,
    InputNumberModule,
    MatSnackBarModule
  ]
})
export class PatientsSectionComponent implements OnInit, OnDestroy {
    patientId: string | null | undefined;
    appointments: any;
    uniqueCode!: string;
    patientDetails: any;
    practices: any[] = [];
    selectedPractice: any;
    showPracticesDropdown: boolean = false;
    practiceSearchText: string = '';
    filteredPractices: any[] = [];
    patientExpanded = true;
    emrExpanded = true;
    billingExpanded = true;
    isNavCollapsed = false;
    routeLink = '/profile';
    userPrivileges: any[] = [];
    patient: any;
    
    // Subscriptions to manage
    private messageSubscription!: Subscription;
    private userSubscription!: Subscription;
    private branchesSubscription!: Subscription;
  clinicalNotes: any;
  completedProcedures: any;
  invoices: any;
  treatmentPlans: any;
  files: any;

    constructor(
        private messageService: MessageService,
        private authService: AuthService, 
        private router: Router,
        private elementRef: ElementRef,
        private userService: UserService,
        private appointmentService: AppointmentService,
        private route: ActivatedRoute,
        private snackBar: MatSnackBar,
        private clinicalNotesService: ClinicalNotesService,
        private treatmentPlansService: TreatmentPlansService,
        private filesService: FileService
    ) {}

    ngOnInit(): void {
      this.branchesSubscription = this.userService.getBranches()
        .pipe(
          catchError(error => {
            this.showErrorMessage('Failed to load practices. Please try again.');
            console.error('Error loading branches:', error);
            return of({ data: [] });
          })
        )
        .subscribe(res => {
          this.practices = res.data;
          this.loadSavedPractice();
        });

      this.messageSubscription = this.messageService.message$.subscribe((message) => {
        this.patientId = message.text;
        this.uniqueCode = message.code;
        
        if (this.uniqueCode) {
          this.loadPatientProfile();
        }
      });

      this.userSubscription = this.authService.getUser()
        .pipe(
          catchError(error => {
            this.showErrorMessage('Failed to load user information.');
            console.error('Error loading user:', error);
            return of({ data: { privileges: [] } });
          })
        )
        .subscribe(res => {
          this.patient = res.data;
          this.userPrivileges = this.patient.privileges.map((p: any) => p.name);
        });
    }

    ngOnDestroy(): void {
      // Clean up subscriptions
      if (this.messageSubscription) {
        this.messageSubscription.unsubscribe();
      }
      if (this.userSubscription) {
        this.userSubscription.unsubscribe();
      }
      if (this.branchesSubscription) {
        this.branchesSubscription.unsubscribe();
      }
    }

    private loadSavedPractice(): void {
      try {
        const savedPractice = localStorage.getItem('selectedPractice');
        if (savedPractice) {
          this.selectedPractice = JSON.parse(savedPractice);
        } else if (this.practices && this.practices.length > 0) {
          this.selectedPractice = this.practices[0];
          localStorage.setItem('selectedPractice', JSON.stringify(this.selectedPractice));
        }
      } catch (error) {
        console.error('Error loading saved practice:', error);
        this.showErrorMessage('Error loading saved practice settings.');
      }
    }

    private loadPatientProfile(): void {
      forkJoin({
        patientDetails: this.userService.getUserProfile(this.uniqueCode),
        appointments: this.appointmentService.getAppointmentsByPatientID(this.uniqueCode),
        clinicalNotes: this.clinicalNotesService.getClinicalNotes(Number(this.patientId)),
        completedProcedures: this.treatmentPlansService.getCompletedTreatmentPlans(Number(this.patientId)),
        treatmentPlans: this.treatmentPlansService.getTreatmentPlans(Number(this.patientId)),
        invoices: this.treatmentPlansService.getInvoices(Number(this.patientId)),
        files: this.filesService.getPatientFiles(Number(this.patientId)),
      }).subscribe({
        next: ({ patientDetails, appointments, clinicalNotes, completedProcedures, invoices, treatmentPlans, files }) => {
          this.patientDetails = patientDetails.data;
          this.appointments = appointments.data;
          this.clinicalNotes = clinicalNotes.data;
          this.completedProcedures = completedProcedures.data;
          this.invoices = invoices.data;
          this.treatmentPlans = treatmentPlans.data;
          this.files = files.data;
        },
      error: (err) => {
        console.error('Error fetching data:', err);
      }
      });
    }

    toggleSection(section: 'patient' | 'emr' | 'billing') {
        if (!this.patientDetails) {
            this.showPatientSelectionWarning();
            return;
        }
        if (!this.isNavCollapsed) {
            switch (section) {
                case 'patient':
                    this.patientExpanded = !this.patientExpanded;
                    break;
                case 'emr':
                    this.emrExpanded = !this.emrExpanded;
                    break;
                case 'billing':
                    this.billingExpanded = !this.billingExpanded;
                    break;
            }
        }
    }
    
    togglePracticesDropdown() {
      this.showPracticesDropdown = !this.showPracticesDropdown;
      
      if (this.showPracticesDropdown) {
        this.practiceSearchText = '';
        this.filteredPractices = [...this.practices];
        
        // Focus on the search input after a short delay
        setTimeout(() => {
          const searchInput = this.elementRef.nativeElement.querySelector('.practice-search');
          if (searchInput) {
            searchInput.focus();
          }
        }, 100);
      }
    }
    
    // Select a practice and save to localStorage
    selectPractice(practice: any) {
      this.selectedPractice = practice;
      this.showPracticesDropdown = false;
      
      // Save to localStorage
      localStorage.setItem('selectedPractice', JSON.stringify(practice));
      window.location.reload();
    }
    
    // Filter practices based on search text
    filterPractices() {
      if (!this.practiceSearchText.trim()) {
        this.filteredPractices = [...this.practices];
        return;
      }
      
      const searchTerm = this.practiceSearchText.toLowerCase().trim();
      this.filteredPractices = this.practices.filter(practice => 
        practice.branch_name.toLowerCase().includes(searchTerm) || 
        practice.branch_id.toString().includes(searchTerm)
      );
    }

    handleNavigation(route: string) {
      if (!this.patientDetails) {
          this.showPatientSelectionWarning();
          return;
      }
      
      // Navigate to the correct route
      this.router.navigate(['/patients', this.patientId, route.substring(1), this.uniqueCode]);
    }

    // Close dropdown when clicking outside
    @HostListener('document:click', ['$event'])
    handleDocumentClick(event: MouseEvent) {
      if (this.showPracticesDropdown && 
          !this.elementRef.nativeElement.querySelector('.email-dropdown')?.contains(event.target)) {
        this.showPracticesDropdown = false;
      }
    }

    openPatientDirectory() {
        this.router.navigate(['/patients/patient-directory']);
    }

    toggleNav() {
        this.isNavCollapsed = !this.isNavCollapsed;
    }

    private showPatientSelectionWarning() {
        this.snackBar.open('Select the patient for further action.', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['warning-snackbar']
        });
    }
    
    private showErrorMessage(message: string) {
        this.snackBar.open(message, 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
        });
    }
}