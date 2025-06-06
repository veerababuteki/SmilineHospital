import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';

@Component({
  selector: 'app-cancel-appointment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    CheckboxModule,
    ButtonModule,
    DropdownModule
  ],
  template: `
    <p-dialog 
      [header]="'Cancel Appointment'" 
      [(visible)]="visible" 
      [modal]="true" 
      [style]="{width: '500px'}" 
      [draggable]="false" 
      [resizable]="false"
      styleClass="cancel-appointment-dialog"
    >
      <div class="cancel-form">
        <div class="form-group">
          <label for="reason">Reason</label>
          <p-dropdown 
            [options]="reasonOptions" 
            [(ngModel)]="selectedReason" 
            optionLabel="label" 
            [style]="{width: '100%'}"
            placeholder="Select a reason">
          </p-dropdown>
        </div>
        
        <div class="form-group">
          <label>Notify patient via</label>
          <div class="notify-options">
            <div class="p-field-checkbox">
              <p-checkbox [(ngModel)]="notifyPatientSMS" [binary]="true" inputId="notifyPatientSMS"></p-checkbox>
              <label for="notifyPatientSMS">SMS</label>
            </div>
            <div class="p-field-checkbox">
              <p-checkbox [(ngModel)]="notifyPatientEmail" [binary]="true" inputId="notifyPatientEmail"></p-checkbox>
              <label for="notifyPatientEmail">Email</label>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label>Notify doctor via</label>
          <div class="notify-options">
            <div class="p-field-checkbox">
              <p-checkbox [(ngModel)]="notifyDoctorSMS" [binary]="true" inputId="notifyDoctorSMS"></p-checkbox>
              <label for="notifyDoctorSMS">SMS</label>
            </div>
            <div class="p-field-checkbox">
              <p-checkbox [(ngModel)]="notifyDoctorEmail" [binary]="true" inputId="notifyDoctorEmail"></p-checkbox>
              <label for="notifyDoctorEmail">Email</label>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <div class="delete-permanently">
            <p-checkbox [(ngModel)]="deletePermanently" [binary]="true" inputId="deletePermanently"></p-checkbox>
            <label for="deletePermanently" class="delete-label">Delete permanently</label>
          </div>
        </div>
      </div>
      
      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <button pButton type="button" label="Close" class="p-button-text" (click)="onClose()"></button>
          <button pButton type="button" label="Cancel Appointment" class="p-button-danger" (click)="onCancelAppointment()"></button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .cancel-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .form-group label {
      font-weight: 500;
      color: #6c757d;
    }
    
    .notify-options {
      display: flex;
      gap: 2rem;
    }
    
    .p-field-checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .delete-permanently {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    
    .delete-label {
      color: #f44336;
      font-weight: 500;
    }
    
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }
    
    :host ::ng-deep .p-button-danger {
      background-color: #ff9800;
      border-color: #ff9800;
    }
    
    :host ::ng-deep .p-button-danger:hover {
      background-color: #f57c00;
      border-color: #f57c00;
    }
  `]
})
export class CancelAppointmentDialogComponent {
  @Input() visible: boolean = false;
  @Input() appointmentData: any;
  
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<any>();
  
  reasonOptions = [
    { label: 'Doctor unavailable/busy', value: 'doctor_unavailable' },
    { label: 'Patient asked to cancel', value: 'patient_requested' },
    { label: 'Other', value: 'other' }
  ];
  
  selectedReason: any = this.reasonOptions[0];
  notifyPatientSMS: boolean = false;
  notifyPatientEmail: boolean = false;
  notifyDoctorSMS: boolean = true;
  notifyDoctorEmail: boolean = true;
  deletePermanently: boolean = false;
  
  onClose() {
    this.close.emit();
  }
  
  onCancelAppointment() {
    const cancelData = {
      appointmentId: this.appointmentData?.extendedProps?.appointmentId,
      reason: this.selectedReason.value,
      notifyPatient: {
        sms: this.notifyPatientSMS,
        email: this.notifyPatientEmail
      },
      notifyDoctor: {
        sms: this.notifyDoctorSMS,
        email: this.notifyDoctorEmail
      },
      deletePermanently: this.deletePermanently
    };
    
    this.confirm.emit(cancelData);
  }
}