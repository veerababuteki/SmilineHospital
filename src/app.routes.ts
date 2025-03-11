import { Routes } from '@angular/router';
import { CalendarComponent } from './app/components/calendar/calendar.component';
import { PatientsSectionComponent } from './app/components/patients-section/patients-section.component';
import { ProfileComponent } from './app/components/patients-section/profile/profile.component';
import { PaymentsComponent } from './app/components/patients-section/payments/payments.component';
import { AppointmentsComponent } from './app/components/patients-section/appointments/appointments.component';
import { ClinicalNotesComponent } from './app/components/patients-section/clinical-notes/clinical-notes.component';
import { TreatmentPlansComponent } from './app/components/patients-section/treatment-plans/treatment-plans.component';
import { CompletedProceduresComponent } from './app/components/patients-section/completed-procedures/completed-procedures.component';
import { FilesComponent } from './app/components/patients-section/files/files.component';
import { TimelineComponent } from './app/components/patients-section/timeline/timeline.component';
import { InvoiceComponent } from './app/components/patients-section/invoice/invoice.component';
import { AppointmentComponent } from './app/components/appointment/appointment.component';
import { EditProfileComponent } from './app/components/patients-section/edit-profile/edit-profile.component';
import { LoginComponent } from './app/components/login/login.component';
import { AppComponent } from './app/app.component';
import { AuthGuard } from './app/auth/auth.guard';
import { HomeComponent } from './app/components/home/home.component';
import { AddTreatmentPlansComponent } from './app/components/patients-section/treatment-plans/add-treatment-plans.component';
import { AddClinicalNotesComponent } from './app/components/patients-section/clinical-notes/add-clinical-notes.component';
import { PatientDirectoryComponent } from './app/components/patients-section/patient-directory/patient-directory.component';
import { AddProfileComponent } from './app/components/patients-section/edit-profile/add-profile.component';
import { AddCompletedProceduresComponent } from './app/components/patients-section/completed-procedures/add-completed-procedures.component';
import { AddInvoiceComponent } from './app/components/patients-section/invoice/add-invoice.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
      path: '', 
      component: HomeComponent,
      canActivate: [AuthGuard],
      children: [
        { path: '', redirectTo: 'calendar', pathMatch: 'full' },
        { path: 'calendar', component: CalendarComponent },
        { path: 'appointment', component: AppointmentComponent },
        { path: 'patients', component: PatientsSectionComponent,
          children: [
            { path: '', redirectTo: 'patient-directory', pathMatch: 'full' },
            { path: 'patient-directory', component: PatientDirectoryComponent},
            { path: ':id', children: [
              { path: 'profile/:source', component: ProfileComponent },
              { path: 'edit-profile/:source', component: EditProfileComponent },
              { path: 'appointments/:source', component: AppointmentsComponent },
              { path: 'clinical-notes', component: ClinicalNotesComponent },
              { path: 'add-clinical-note', component: AddClinicalNotesComponent },
              { path: 'treatment-plans', component: TreatmentPlansComponent },
              { path: 'add-treatment-plan', component: AddTreatmentPlansComponent },
              { path: 'add-completed-procedures', component: AddCompletedProceduresComponent },
              { path: 'completed-procedures', component: CompletedProceduresComponent },
              { path: 'files', component: FilesComponent },
              { path: 'timeline', component: TimelineComponent },
              { path: 'add-invoice', component: AddInvoiceComponent },
              { path: 'invoices', component: InvoiceComponent },
              { path: 'payments', component: PaymentsComponent },
            ]}
          ] 
        }
      ]
    },
    
];