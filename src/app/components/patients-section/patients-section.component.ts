import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { ProfileComponent } from './profile/profile.component';
import { AppointmentsComponent } from './appointments/appointments.component';
import { ClinicalNotesComponent } from './clinical-notes/clinical-notes.component';
import { TreatmentPlansComponent } from './treatment-plans/treatment-plans.component';
import { CompletedProceduresComponent } from './completed-procedures/completed-procedures.component';
import { FilesComponent } from './files/files.component';
import { TimelineComponent } from './timeline/timeline.component';
import { PaymentsComponent } from './payments/payments.component';
import { InvoiceComponent } from './invoice/invoice.component';
import { ActivatedRoute, Router, RouterModule, RouterOutlet } from '@angular/router';
import { MessageService } from '../../services/message.service';
import { AuthService } from '../../services/auth.service';
import { AppointmentService } from '../../services/appointment.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-patients-section',
  templateUrl: './patients-section.component.html',
  styleUrls: ['./patients-section.component.scss'],
  standalone: true,
  imports: [ CommonModule, 
    RouterOutlet,RouterModule, FormsModule,
  ]
})
export class PatientsSectionComponent implements OnInit {
    patientId: string | null | undefined;
    appointments: any;
    uniqueCode!: string;
    patientDetails: any;
    practices: any[] = [];
    selectedPractice: any;
    showPracticesDropdown: boolean = false;
    practiceSearchText: string = '';
    filteredPractices: any[] = [];
    ngOnInit(): void {
      this.userService.getBranches().subscribe(res=>{
        this.practices = res.data;
        const savedPractice = localStorage.getItem('selectedPractice');
        if (savedPractice) {
          this.selectedPractice = JSON.parse(savedPractice);
        } else {
          this.selectedPractice = this.practices[0];
          localStorage.setItem('selectedPractice', JSON.stringify(this.selectedPractice));
        }
      })
      this.messageService.message$.subscribe((message) => {
        this.patientId = message.text;
        this.uniqueCode = message.code;
        this.useService.getUserProfile(this.uniqueCode).subscribe(res => {
          this.patientDetails = res.data;
        });
      });
      this.authService.getUser().subscribe(res => {
        this.patient = res.data;
        this.userPrivileges = this.patient.privileges.map((p: any) => p.name)
      });
    }

    constructor(private messageService: MessageService,
        private authService: AuthService, 
        private router: Router,
        private elementRef: ElementRef,
        private useService: UserService,
        private appointmentService: AppointmentService,
        private route:ActivatedRoute,
        private userService: UserService,
    ) {}

    patientExpanded = true;
    emrExpanded = true;
    billingExpanded = true;
    isNavCollapsed = false;
    routeLink = '/profile';
    userPrivileges: any[] = [];
    patient: any;
    toggleSection(section: 'patient' | 'emr' | 'billing') {
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

  handleNavigation(route: string): (string | null | undefined)[] | null {
    return ['/patients', this.patientId, route.substring(1), this.uniqueCode];
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent) {
  if (this.showPracticesDropdown && 
      !this.elementRef.nativeElement.querySelector('.email-dropdown').contains(event.target)) {
    this.showPracticesDropdown = false;
  }
  }
    // goToChild(page: string) {
    //     switch (page) {
    //         case 'appointments':
    //             this.router.navigate(['/patients/appointments'], { state: { appointments: this.appointments?.rows } });
    //             break;
    //     }
    // }
    openPatientDirectory(){
        this.router.navigate(['/patients/patient-directory']);

    }

    toggleNav() {
        this.isNavCollapsed = !this.isNavCollapsed;
    }
}