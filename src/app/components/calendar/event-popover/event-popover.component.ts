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
    <div class="event-popover"  (mouseenter)="onMouseEnter()" 
         (mouseleave)="onMouseLeave()">
      <div class="event-header">
        <div class="avatar-section">
          <p-avatar [label]="getInitials(event.extendedProps?.patientName)" shape="circle" size="large" class="patient-avatar"></p-avatar>
          <div class="patient-info">
            <a (click)="navigateToProfile()"><h3>{{ event.extendedProps?.patientName }}</h3></a>
            <div class="patient-details">
              <span>{{ event.extendedProps?.patientCode || '111398' }}</span>
              <span class="dot">•</span>
              <span>{{ event.extendedProps?.age || '36' }} Years</span>
            </div>
            <div class="show-balance">Show Balance</div>
          </div>
        </div>
        <div>
            <button pButton icon="pi pi-user-edit" class="p-button-text p-button-rounded" (click)="editEvent()"></button>
            <button pButton icon="pi pi-times" class="p-button-text p-button-rounded" (click)="deleteEvent()"></button>
        </div>
      </div>

      <div class="contact-info">
        <div class="info-item">
          <i class="pi pi-phone"></i>
          {{ event.extendedProps?.phone || '+919505941480' }}
        </div>
        <div class="info-item not-available">
          <i class="pi pi-envelope"></i>
          {{event.extendedProps?.email}}
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
          <div class="doctor-info">with Dr.{{ event.extendedProps?.doctor || 'Alla Kranthi' }} at</div>
          <div class="time-info">{{ event.extendedProps?.appointmentTime }} for {{ event.extendedProps?.duration || '1 hr 30 mins' }}</div>
        </div>
        <button pButton label="No Show" class="p-button-outlined"></button>
      </div>

      <div class="category-section">
        <div class="category-label">Category:</div>
        <div class="category-value">{{ event.extendedProps?.category || 'Flap Surgery' }}</div>
      </div>

      <div class="notes-section">
        <div class="notes-label">Notes</div>
        <div class="notes-content">{{ event.extendedProps?.notes || 'pt dont want flap surgery dr...' }}</div>
      </div>

      <div class="payment-section">
        <div class="payment-info">
          <i class="pi pi-info-circle"></i>
          <div>
            Collect payments online from patients anytime!
            <a href="#" class="get-it-link">Get it now</a>
          </div>
        </div>
        <div class="collect-btn">
            <button pButton label="Collect Payment" class="p-button-warning collect-payment-btn"></button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .collect-btn{
        display: flex;
        justify-content: right;
    }
    .event-popover {
    background: white;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    padding: 16px;
    min-width: 300px;
    font-family: var(--font-family);
    position: relative;
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
  .patient-info{
    margin-left: 15px;
  }
  .patient-info h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    color: #1a9ccf;
    cursor: pointer;
    &:hover{
      text-decoration: underline;
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
  }

  .time-info {
    color: #333;
  }

  .no-show-btn {
    padding: 6px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
    cursor: pointer;
  }

  .category-section, .notes-section {
    margin-bottom: 16px;
    font-size: 14px;
  }

  .category-label, .notes-label {
    color: #666;
    margin-bottom: 4px;
  }

  .category-value, .notes-content {
    color: #333;
  }

  .payment-section {
    border-radius: 6px;
  }

  .payment-info {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 14px;
    padding: 12px;
    background: #e5f9fd;
    border-radius: 6px;
  }

  .get-it-link {
    color: #00a3c4;
    text-decoration: none;
  }

  .collect-payment-btn {
    width: 30%;
    padding: 8px;
    background: #ff9f00;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
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
  constructor(private router: Router){

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
  navigateToProfile(){
    const url = this.router.createUrlTree([
      'patients',
      this.event.extendedProps?.patientId,
      'profile',
      this.event.extendedProps?.patientCode
    ]).toString()
    window.open(url, '_blank');
  }
  deleteEvent() {
    this.delete.emit(this.event);
    this.close.emit();
  }
  onMouseEnter() {
    this.mouseEnter.emit();
  }

  onMouseLeave() {
    this.mouseLeave.emit();
  }
}