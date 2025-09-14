import { Component, Input, EventEmitter, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PrimeIcons } from 'primeng/api';
import { OverlayModule } from '@angular/cdk/overlay';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-event-popover',
  imports:[
    OverlayModule,
    CommonModule,
    ButtonModule,
    AvatarModule
  ],
  template: `
    <div class="event-popover" (mouseenter)="onMouseEnter()" (mouseleave)="onMouseLeave()">
      
      <!-- Block Calendar Event Template -->
      <div *ngIf="isBlockCalendarEvent" class="block-calendar-content">
        <div class="block-header">
          <div class="block-icon-section">
            <i class="pi pi-ban block-icon"></i>
            <div class="block-info">
              <h3 class="block-title">{{ getBlockTitle() }}</h3>
              <div class="block-type">{{ getBlockTypeLabel() }}</div>
            </div>
          </div>
          <div class="block-actions" *ngIf="canEditBlock">
            <button pButton icon="pi pi-trash" class="p-button-text p-button-rounded p-button-sm" 
                    (click)="deleteBlockCalendar()" title="Delete Block">
            </button>
          </div>
        </div>

        <div class="block-details-section">
          <!-- Doctor Information -->
          <div class="info-item">
            <i class="pi pi-user-md"></i>
            <span>{{ getDoctorName() }}</span>
          </div>

          <!-- Date/Time Information -->
          <div class="info-item">
            <i class="pi pi-calendar"></i>
            <span>{{ getDateTimeInfo() }}</span>
          </div>

          <!-- Block Type Information -->
          <div class="info-item" *ngIf="!event.extendedProps.doctorId">
            <i class="pi pi-info-circle"></i>
            <span>{{ getBlockedAppointmentTypes() }}</span>
          </div>

          <!-- Created By -->
          <div class="info-item" *ngIf="event.extendedProps.createdBy">
            <i class="pi pi-user"></i>
            <span>Created by: {{ event.extendedProps.createdBy }}</span>
          </div>
        </div>

        <!-- Reason/Details -->
        <div class="block-reason-section">
          <div class="reason-label">Reason:</div>
          <div class="reason-content">{{ event.extendedProps.leaveDetails || 'No reason provided' }}</div>
        </div>
      </div>

      <!-- Regular Appointment Event Template -->
      <div *ngIf="!isBlockCalendarEvent" class="appointment-content">
        <div class="event-header">
          <div class="avatar-section">
            <!-- <pre>{{ getInitials(event.extendedProps?.patientName) }} </pre> -->
            <p-avatar [label]="getInitials(event.extendedProps?.patientName)" shape="circle" size="large" class="patient-avatar"></p-avatar>
            <div class="patient-info">
              <a (click)="navigateToProfile()"><h3>{{ event.extendedProps?.patientName }}</h3></a>
              <div class="patient-details">
                <span>{{ event.extendedProps?.patientCode || '111398' }}</span>
                <span class="dot"> </span>
                <span>{{ event.extendedProps?.age || '' }} </span>
              </div>
            <div 
  class="show-balance" 
  (click)="event.showBalance = !event.showBalance" 
  [ngStyle]="{
    'color': event.showBalance 
              ? (event.extendedProps?.availableAdvance == 0 ? 'red' : 'green') 
              : '#1a9ccf',
    'opacity': event.showBalance && event.extendedProps?.availableAdvance == 0 ? 0.6 : 1,
    'display': 'inline-block',
    'width': '110px', 
    'text-align': 'left'
  }">
  {{ event.showBalance 
      ? (event.extendedProps?.availableAdvance == 0 
            ? '₹0.00' 
            : ('₹' + (event.extendedProps?.availableAdvance | number:'1.2-2'))) 
      : 'Show Balance' }}
</div>
            </div>
          </div>
          <div>
              <button pButton class="p-button-rounded" (click)="editEvent()">Edit Appointment</button>
              <button pButton icon="pi pi-trash" class="p-button-text p-button-rounded" (click)="deleteEvent()"></button>
          </div>
        </div>

        <div class="contact-info">
          <div class="info-item">
            <i class="pi pi-phone"></i>
            {{ event.extendedProps?.phone || '+919505941480' }}
          </div>
          <div class="info-item not-available">
            <i class="pi pi-envelope"></i>
            <span [ngClass]="{'text-muted': !event.extendedProps?.email}">
          {{ event.extendedProps?.email && event.extendedProps?.email.trim() !== '' 
            ? event.extendedProps.email 
            : 'No email provided' }}
        </span>
          </div>
          <div class="info-item token-info">
            <i class="pi pi-ticket"></i>
            Token: Not available
          </div>
        </div>

        <div class="appointment-info">
          <i class="pi pi-calendar"></i>
          <div class="appointment-details">
            <div>In-Clinic Appointment</div>
            <div class="doctor-info" *ngIf="event.extendedProps?.doctor">with Dr.{{ event.extendedProps?.doctor}}</div>
            <div class="time-info">at {{ event.extendedProps?.appointmentTime }} for {{ event.extendedProps?.duration || '1 hr 30 mins' }}</div>
          </div>
          <!--  <button pButton label="No Show" class="p-button-outlined"></button> -->
        </div>

        <div class="category-section">
          <div class="category-label">Category:</div>
          <div class="category-value">{{ event.extendedProps?.category || 'N/A' }}</div>
        </div>

        <div class="notes-section">
          <div class="notes-label">Notes</div>
          <div class="notes-content">{{ event.extendedProps?.notes || 'N/A' }}</div>
        </div>

        
      </div>
    </div>
  `,
  styles: [`
    .event-popover {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 16px;
      min-width: 320px;
      max-width: 400px;
      font-family: var(--font-family);
      position: relative;
    }

    /* Block Calendar Styles */
    .block-calendar-content {
      .block-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
        
        .block-icon-section {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          
          .block-icon {
            font-size: 24px;
            color: #dc3545;
            margin-top: 4px;
          }
          
          .block-info {
            .block-title {
              margin: 0 0 4px 0;
              font-size: 16px;
              font-weight: 600;
              color: #333;
            }
            
            .block-type {
              font-size: 12px;
              color: #666;
              background: #f8f9fa;
              padding: 2px 8px;
              border-radius: 12px;
              display: inline-block;
            }
          }
        }
        
        .block-actions {
          display: flex;
          gap: 8px;
        }
      }
      
      .block-details-section {
        margin-bottom: 16px;
        
        .info-item {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          font-size: 14px;
          color: #333;
          
          i {
            font-size: 14px;
            color: #666;
            width: 18px;
            text-align: center;
          }
        }
      }
      
      .block-reason-section {
        padding: 12px;
        background: #fff3cd;
        border-radius: 6px;
        border-left: 4px solid #ffc107;
        
        .reason-label {
          font-size: 12px;
          font-weight: 600;
          color: #856404;
          margin-bottom: 4px;
        }
        
        .reason-content {
          font-size: 14px;
          color: #856404;
          line-height: 1.4;
        }
      }
    }

    /* Regular appointment styles */
    .appointment-content {
      .collect-btn {
        display: flex;
        justify-content: right;
      }
      
      .event-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
        position: relative;
      }

      .avatar-section {
        display: flex;
        gap: 12px;
      }
      
      .patient-info {
        margin-left: 15px;
        
        h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 500;
          color: #1a9ccf;
          cursor: pointer;
          &:hover{
            text-decoration: underline;
          }
        }
      }

      .patient-details {
        font-size: 13px;
        color: #666;
        margin: 4px 0;
      }

      .dot {
        margin: 0 6px;
        color: #666;
      }

      .show-balance {
        color: #00a3c4;
        font-size: 13px;
        cursor: pointer;
        margin-top: 2px;
      }

      .contact-info {
        margin-bottom: 20px;
      }

      .info-item {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 13px;
        color: #333;

        i {
          font-size: 14px;
          color: #666;
          width: 16px;
        }
      }

      .not-available {
        color: #999;
      }

      .appointment-info {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 4px;
        margin-bottom: 16px;

        i {
          font-size: 14px;
          color: #666;
          margin-top: 2px;
        }
      }

      .appointment-details {
        flex-grow: 1;
        font-size: 13px;
      }

      .doctor-info {
        color: #666;
        margin: 2px 0;
      }

      .time-info {
        color: #333;
      }

      :host ::ng-deep .p-button.p-button-outlined {
        padding: 4px 8px;
        font-size: 13px;
        border-color: #ddd;
        color: #333;
      }

      .category-section, .notes-section {
        margin-bottom: 16px;
      }

      .category-label, .notes-label {
        color: #666;
        margin-bottom: 4px;
        font-size: 13px;
      }

      .category-value, .notes-content {
        color: #333;
        font-size: 13px;
      }

      .payment-section {
        border-radius: 4px;
        margin-top: 20px;
      }

      .payment-info {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
        font-size: 13px;
        padding: 12px;
        background: #e5f9fd;
        border-radius: 6px;
        
        i {
          font-size: 14px;
          color: var(--primary-color);
          margin-top: 2px;
        }
      }

      .get-it-link {
        color: #00a3c4;
        text-decoration: none;
        margin-left: 4px;
      }

      .collect-payment-btn {
        width: 30%;
      }
    }

    :host ::ng-deep {
      .patient-avatar {
        width: 36px !important;
        height: 36px !important;
        color: #666;
        font-size: 14px !important;
      }

      .p-button.p-button-warning {
        background: #ff9f00;
        border-color: #ff9f00;
        font-size: 13px;
        padding: 8px;
      }

      .p-button.p-button-text {
        padding: 4px;
        color: #666;
      }
      
      .p-button.p-button-sm {
        padding: 6px 12px;
        font-size: 12px;
      }
    }
  `]
})
export class EventPopoverComponent {
  @Input() event: any;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() mouseEnter = new EventEmitter<void>();
  @Output() mouseLeave = new EventEmitter<void>();
  @Output() editBlock = new EventEmitter<any>();
  @Output() deleteBlock = new EventEmitter<any>();

  constructor(private router: Router) {}

  get isBlockCalendarEvent(): boolean {
    return this.event?.extendedProps?.type === 'block_calendar';
  }

  get canEditBlock(): boolean {
    // Add your logic here to determine if user can edit block calendar
    // For example, check if current user is admin or the creator
    return true; // Modify based on your requirements
  }

  getBlockTitle(): string {
    if (this.event.extendedProps.doctorName && this.event.extendedProps.doctorName !== 'All Doctors') {
      return `Dr. ${this.event.extendedProps.doctorName} - Blocked`;
    }
    return 'Calendar Blocked';
  }

  getBlockTypeLabel(): string {
    if (this.event.extendedProps.blockType === 'allDay') {
      return 'All Day Block';
    } else if (this.event.extendedProps.blockType === 'blockSlot') {
      return 'Time Slot Block';
    }
    return 'Calendar Block';
  }

  getDoctorName(): string {
    if (this.event.extendedProps.doctorName && this.event.extendedProps.doctorName !== 'All Doctors') {
      return `Dr. ${this.event.extendedProps.doctorName}`;
    }
    return 'All Doctors';
  }

  getDateTimeInfo(): string {
    if (this.event.extendedProps.blockType === 'allDay') {
      if (this.event.start && this.event.end) {
        const startDate = new Date(this.event.start).toLocaleDateString();
        const endDate = new Date(this.event.end).toLocaleDateString();
        if (startDate === endDate) {
          return `All day on ${startDate}`;
        }
        return `${startDate} to ${endDate}`;
      }
      return 'All day';
    } else if (this.event.extendedProps.blockType === 'blockSlot') {
      const date = this.event.start ? new Date(this.event.start).toLocaleDateString() : '';
      const startTime = this.event.extendedProps.startTime || '';
      const endTime = this.event.extendedProps.endTime || '';
      return `${date} from ${startTime} to ${endTime}`;
    }
    return '';
  }

  getBlockedAppointmentTypes(): string {
    const types = [];
    if (this.event.extendedProps.blockVideoAppointments) {
      types.push('Video Appointments');
    }
    if (this.event.extendedProps.blockInClinicAppointments) {
      types.push('In-Clinic Appointments');
    }
    
    if (types.length === 0) {
      return 'No specific appointment types blocked';
    }
    
    return `Blocking: ${types.join(' & ')}`;
  }

  getInitials(name: string = ''): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  editEvent() {
    this.edit.emit(this.event);
    this.close.emit();
  }

  editBlockCalendar() {
    this.editBlock.emit(this.event);
    this.close.emit();
  }

  navigateToProfile() {
  const patientId = this.event.extendedProps?.patientId;
  const patientCode = this.event.extendedProps?.patientCode || this.event.extendedProps?.unique_code;
  if (patientId && patientCode) {
    const url = this.router.createUrlTree([
      'patients',
      patientId,
      'profile',
      this.event.extendedProps?.patientUniqueCode
    ]).toString()
    window.open(url, '_blank');
  } else {
    // Optionally show an error or fallback
    alert('Patient ID or Code missing!');
  }
}
  deleteEvent() {
    this.delete.emit(this.event);
    this.close.emit();
  }

  deleteBlockCalendar() {
    this.deleteBlock.emit(this.event);
    this.close.emit();
  }

  onMouseEnter() {
    this.mouseEnter.emit();
  }

  onMouseLeave() {
    this.mouseLeave.emit();
  }
}
// commented code of payments in event
// <div class="payment-section">
//           <div class="payment-info">
//             <i class="pi pi-info-circle"></i>
//             <div>
//               Collect payments online from patients anytime!
//               <a href="#" class="get-it-link">Get it now</a>
//             </div>
//           </div>
//           <div class="collect-btn">
//               <button pButton label="Collect Payment" class="p-button-warning collect-payment-btn"></button>
//           </div>
//         </div>