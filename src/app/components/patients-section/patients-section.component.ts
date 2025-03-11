import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
import { Router, RouterModule, RouterOutlet } from '@angular/router';
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
    RouterOutlet,RouterModule,
  ]
})
export class PatientsSectionComponent implements OnInit {
    patientId: string | null | undefined;
    appointments: any;
    uniqueCode!: string;
    patientDetails: any;
    ngOnInit(): void {
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
        private useService: UserService,
        private appointmentService: AppointmentService,
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