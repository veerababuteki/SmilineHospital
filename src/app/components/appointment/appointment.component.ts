// Complete updated appointment.component.ts with all block calendar functionality

import { Component, EventEmitter, Input, input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { UserService } from '../../services/user.service';
import { AppointmentService } from '../../services/appointment.service';
import { format } from 'date-fns';
import { empty } from 'rxjs';
import { Router } from '@angular/router';
import { Message } from 'primeng/api';
import { MessagesModule } from 'primeng/messages';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-appointment',
  templateUrl: './appointment.component.html',
  styleUrls: ['./appointment.component.scss'],
  imports: [
    DialogModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    CalendarModule,
    InputTextareaModule,
    CheckboxModule,
    RadioButtonModule,
    ReactiveFormsModule,
    CommonModule,
    MessagesModule
  ]
})
export class AppointmentComponent implements OnInit {
  activeTab: 'appointment' | 'reminder' | 'blockCalendar' = 'appointment';
  appointmentForm!: FormGroup;
  blockCalendarForm!: FormGroup;
  display: boolean = false;
  durations = [
    { label: '15 Min', value: 15 },
    { label: '30 Min', value: 30 },
    { label: '45 Min', value: 45 },
    { label: '1 Hr', value: 60 },
    { label: '2 Hrs', value: 120 },
    { label: '3 Hrs', value: 180 },
    { label: '4 Hrs', value: 240 },
    { label: '5 Hrs', value: 300 }
  ];
  bookingTypes: string[] = ['offline', 'online'];
  status: string[] = ["Scheduled", "Completed", "Cancelled", "Rescheduled"];
  appointmentStatus: string[] = ['None', 'Waiting', 'Engaged', 'Done'];
  showScheduleWarning: boolean = false;
  public selectedDate: any;
  multiplePatients: any[] = [];
  showPatientDropdown: boolean = false;
  @Input() data!: 'appointment' | 'reminder' | 'blockCalendar';
  @Input() doctors!: any[];
  @Input() categories!: any[];
  @Input() isDoctor: boolean = false;
  patient: any;
  @Input() currentUser: any;
  @Input() editAppointment: boolean = false;
  @Input() fromPatientsection: boolean = false;
  appointementId!: number;
  appointment: any;
  @Input() patientCode: any;
  @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();
  paitentNotFound: boolean = false;
  messages: Message[] = [
    { severity: 'info', summary: 'Info', detail: 'Message Content' },
  ];

  today = new Date();

  // Block calendar properties
  blockCalendarData: any[] = [];
  allDoctorBlocks: any[] = [];
  specificDoctorBlocks: any[] = [];
  isCheckingBlocks: boolean = false;
  hasBlockConflicts: boolean = false;
  blockConflictMessage: string = '';
  showBlockWarning: boolean = false;
  doctorAvailabilityStatus: 'available' | 'partially-blocked' | 'fully-blocked' | 'unknown' = 'unknown';
  availabilityMessage: string = '';

  // Computed property for minToDate
  get minToDate(): Date {
    return this.today;
  }

  constructor(
    private fb: FormBuilder, 
    private router: Router, 
    private userService: UserService, 
    private appointmentService: AppointmentService, 
    private loaderService: LoaderService
  ) {}

  ngOnInit() {
    this.activeTab = this.data;
    this.initAppointmentForm();
    this.initBlockCalendarForm();
  }

  initAppointmentForm() {
    this.initForm();
    
    // Setup watchers after a small delay to ensure form is ready
    setTimeout(() => {
      this.setupBlockCalendarWatchers();
    }, 100);
  }

  // Setup watchers for automatic block checking
  setupBlockCalendarWatchers() {
    console.log('Setting up block calendar watchers...');
    
    // Watch for doctor selection changes
    this.appointmentForm.get('doctor')?.valueChanges.subscribe(doctor => {
      console.log('Doctor changed:', doctor);
      if (doctor && this.appointmentForm.get('scheduledDate')?.value) {
        console.log('Both doctor and date available, checking blocks...');
        setTimeout(() => this.checkBlockCalendar(), 200);
      } else {
        console.log('Doctor or date missing, clearing warnings');
        this.clearBlockWarnings();
      }
    });

    // Watch for date changes
    this.appointmentForm.get('scheduledDate')?.valueChanges.subscribe(date => {
      console.log('Date changed:', date);
      if (date && this.appointmentForm.get('doctor')?.value) {
        console.log('Both doctor and date available, checking blocks...');
        setTimeout(() => this.checkBlockCalendar(), 200);
      } else {
        console.log('Doctor or date missing, clearing warnings');
        this.clearBlockWarnings();
      }
    });

    // Watch for time changes to check slot conflicts
    this.appointmentForm.get('scheduledTime')?.valueChanges.subscribe(time => {
      console.log('Time changed:', time);
      if (time && this.appointmentForm.get('doctor')?.value && this.appointmentForm.get('scheduledDate')?.value) {
        this.checkTimeSlotConflict();
      }
    });

    // Watch for booking type changes (for all doctors blocks)
    this.appointmentForm.get('bookingType')?.valueChanges.subscribe(bookingType => {
      console.log('Booking type changed:', bookingType);
      if (bookingType && (this.specificDoctorBlocks.length > 0 || this.allDoctorBlocks.length > 0)) {
        this.determineDoctorAvailabilityStatus();
        this.checkTimeSlotConflict();
      }
    });
  }

  // Method to check doctor availability and block calendar for selected date
  async checkBlockCalendar() {
    const doctor = this.appointmentForm.get('doctor')?.value;
    const scheduledDate = this.appointmentForm.get('scheduledDate')?.value;

    console.log('checkBlockCalendar called with:', { doctor, scheduledDate });

    if (!doctor || !scheduledDate) {
      console.log('Missing doctor or date, clearing warnings');
      this.clearBlockWarnings();
      return;
    }

    console.log('Starting block calendar check...');
    this.isCheckingBlocks = true;
    this.blockCalendarData = [];
    this.allDoctorBlocks = [];
    this.specificDoctorBlocks = [];
    
    try {
      const dateStr = format(new Date(scheduledDate), 'yyyy-MM-dd');
      console.log('Formatted date:', dateStr);
      
      // Get specific doctor blocks
      const doctorResponse = await this.appointmentService.getBlockCalendarByDoctor(
        doctor.user_id, 
        dateStr, 
        dateStr
      ).toPromise();

      console.log('Doctor blocks response:', doctorResponse);
      this.specificDoctorBlocks = doctorResponse.data?.rows || [];
      console.log('Specific doctor blocks:', this.specificDoctorBlocks);

      // Get all doctors blocks
      await this.fetchAllDoctorsBlocks();
      
      this.processDoctorAvailability();
      
    } catch (error) {
      console.error('Error checking doctor availability:', error);
      this.blockConflictMessage = 'Unable to check doctor availability. Please try again.';
      this.showBlockWarning = true;
    } finally {
      this.isCheckingBlocks = false;
      console.log('Block calendar check completed');
    }
  }

  // Fetch blocks that affect all doctors
  async fetchAllDoctorsBlocks() {
    try {
      const scheduledDate = this.appointmentForm.get('scheduledDate')?.value;
      if (!scheduledDate) {
        console.log('No scheduled date available for all doctors blocks');
        return;
      }
      
      const dateStr = format(new Date(scheduledDate), 'yyyy-MM-dd');
      console.log('Fetching all doctors blocks for date:', dateStr);
      
      const response = await this.appointmentService.getBlockCalendarByDateRange(
        dateStr, 
        dateStr
      ).toPromise();

      console.log('All doctors blocks response:', response);
      
      this.allDoctorBlocks = (response.data?.rows || []).filter((block: any) => 
        !block.doctor_details?.user_id && !block.doctor_id
      );
      
      console.log('All doctor blocks:', this.allDoctorBlocks);
      
    } catch (error) {
      console.error('Error fetching all doctors blocks:', error);
    }
  }

  // Process doctor availability and all block data for the day
  processDoctorAvailability() {
    console.log('Processing doctor availability...');
    console.log('Specific doctor blocks:', this.specificDoctorBlocks);
    console.log('All doctor blocks:', this.allDoctorBlocks);
    
    // Determine availability status
    this.determineDoctorAvailabilityStatus();
    
    // Always show the availability section when doctor and date are selected
    this.showBlockWarning = true;
    
    // Check for time slot conflicts if time is already selected
    if (this.appointmentForm.get('scheduledTime')?.value) {
      this.checkTimeSlotConflict();
    }
  }

  // Determine doctor availability status for the day
  determineDoctorAvailabilityStatus() {
    console.log('Determining availability status...');
    
    const allDayBlocks = [
      ...this.specificDoctorBlocks.filter(block => block.block_type === 'allDay'),
      ...this.allDoctorBlocks.filter(block => block.block_type === 'allDay')
    ];

    const timeSlotBlocks = [
      ...this.specificDoctorBlocks.filter(block => block.block_type === 'blockSlot'),
      ...this.allDoctorBlocks.filter(block => block.block_type === 'blockSlot')
    ];

    console.log('All day blocks:', allDayBlocks);
    console.log('Time slot blocks:', timeSlotBlocks);

    const bookingType = this.appointmentForm.get('bookingType')?.value || 'offline';
    console.log('Booking type:', bookingType);
    
    const affectedByAllDoctorBlocks = this.allDoctorBlocks.some(block => 
      (bookingType === 'online' && block.block_video_appointments) ||
      (bookingType === 'offline' && block.block_in_clinic_appointments)
    );

    console.log('Affected by all doctor blocks:', affectedByAllDoctorBlocks);

    if (allDayBlocks.length > 0 || affectedByAllDoctorBlocks) {
      this.doctorAvailabilityStatus = 'fully-blocked';
      this.availabilityMessage = 'Doctor is not available for the entire day';
      this.hasBlockConflicts = true;
    } else if (timeSlotBlocks.length > 0) {
      this.doctorAvailabilityStatus = 'partially-blocked';
      this.availabilityMessage = `Doctor has ${timeSlotBlocks.length} blocked time slot(s)`;
      this.hasBlockConflicts = false; // Can still book at available times
    } else {
      this.doctorAvailabilityStatus = 'available';
      this.availabilityMessage = 'Doctor is available for appointments';
      this.hasBlockConflicts = false;
    }

    console.log('Final availability status:', this.doctorAvailabilityStatus);
    console.log('Availability message:', this.availabilityMessage);

    this.generateDetailedAvailabilityMessage();
  }

  // Generate detailed availability message
  generateDetailedAvailabilityMessage() {
    const messages: string[] = [];
    
    // Add specific doctor blocks
    this.specificDoctorBlocks.forEach(block => {
      if (block.block_type === 'allDay') {
        messages.push(`🚫 Full day blocked: ${block.leave_details || 'No reason specified'}`);
      } else {
        messages.push(`⏰ Time blocked: ${block.start_time} - ${block.end_time} (${block.leave_details || 'No reason specified'})`);
      }
    });

    // Add all doctors blocks that affect this booking type
    const bookingType = this.appointmentForm.get('bookingType')?.value || 'offline';
    this.allDoctorBlocks.forEach(block => {
      const isAffected = (bookingType === 'online' && block.block_video_appointments) ||
                         (bookingType === 'offline' && block.block_in_clinic_appointments);
      
      if (isAffected) {
        if (block.block_type === 'allDay') {
          messages.push(`🚫 All doctors blocked: ${block.leave_details || 'No reason specified'}`);
        } else {
          messages.push(`⏰ All doctors blocked: ${block.start_time} - ${block.end_time} (${block.leave_details || 'No reason specified'})`);
        }
      }
    });

    this.blockConflictMessage = messages.length > 0 ? messages.join('\n') : this.availabilityMessage;
  }

  // Check for specific time slot conflicts
  checkTimeSlotConflict() {
    if (!this.appointmentForm.get('scheduledTime')?.value) {
      return;
    }

    const selectedTime = format(new Date(this.appointmentForm.get('scheduledTime')?.value), 'HH:mm');
    const bookingType = this.appointmentForm.get('bookingType')?.value;

    console.log('Checking time slot conflict for:', selectedTime, 'booking type:', bookingType);

    const allBlocks = [...this.specificDoctorBlocks, ...this.allDoctorBlocks];
    const conflictingSlots = allBlocks.filter(block => {
      if (block.block_type === 'allDay') return true;
      
      if (block.block_type === 'blockSlot') {
        const startTime = block.start_time;
        const endTime = block.end_time;
        return selectedTime >= startTime && selectedTime <= endTime;
      }

      // Check all doctor blocks for booking type conflicts
      if (!block.doctor_details?.user_id && !block.doctor_id) {
        return (bookingType === 'online' && block.block_video_appointments) ||
               (bookingType === 'offline' && block.block_in_clinic_appointments);
      }

      return false;
    });

    console.log('Conflicting slots:', conflictingSlots);

    if (conflictingSlots.length > 0) {
      this.hasBlockConflicts = true;
      // Update the form with validation error
      this.appointmentForm.get('scheduledTime')?.setErrors({ 
        ...this.appointmentForm.get('scheduledTime')?.errors,
        timeBlocked: true 
      });
    } else {
      // Clear time block error if no conflicts
      const errors = this.appointmentForm.get('scheduledTime')?.errors;
      if (errors && errors['timeBlocked']) {
        delete errors['timeBlocked'];
        const hasOtherErrors = Object.keys(errors).length > 0;
        this.appointmentForm.get('scheduledTime')?.setErrors(hasOtherErrors ? errors : null);
      }
    }
  }

  // Clear all block warnings and availability data
  clearBlockWarnings() {
    this.blockCalendarData = [];
    this.allDoctorBlocks = [];
    this.specificDoctorBlocks = [];
    this.hasBlockConflicts = false;
    this.blockConflictMessage = '';
    this.showBlockWarning = false;
    this.isCheckingBlocks = false;
    this.doctorAvailabilityStatus = 'unknown';
    this.availabilityMessage = '';

    // Clear time block validation error
    const timeControl = this.appointmentForm.get('scheduledTime');
    const errors = timeControl?.errors;
    if (errors && errors['timeBlocked']) {
      delete errors['timeBlocked'];
      const hasOtherErrors = Object.keys(errors).length > 0;
      timeControl?.setErrors(hasOtherErrors ? errors : null);
    }
  }

  // Get all blocks for display (both specific doctor and all doctors)
  getAllBlocksForDisplay(): any[] {
    return [...this.specificDoctorBlocks, ...this.allDoctorBlocks].sort((a, b) => {
      // Sort by block type (allDay first) then by time
      if (a.block_type !== b.block_type) {
        return a.block_type === 'allDay' ? -1 : 1;
      }
      if (a.block_type === 'blockSlot' && b.block_type === 'blockSlot') {
        return a.start_time?.localeCompare(b.start_time) || 0;
      }
      return 0;
    });
  }

  // Get availability status class for styling
  getAvailabilityStatusClass(): string {
    switch (this.doctorAvailabilityStatus) {
      case 'available': return 'status-available';
      case 'partially-blocked': return 'status-partial';
      case 'fully-blocked': return 'status-blocked';
      default: return 'status-unknown';
    }
  }

  // Get availability status icon
  getAvailabilityStatusIcon(): string {
    switch (this.doctorAvailabilityStatus) {
      case 'available': return 'pi-check-circle';
      case 'partially-blocked': return 'pi-exclamation-triangle';
      case 'fully-blocked': return 'pi-times-circle';
      default: return 'pi-question-circle';
    }
  }

  // Enhanced appointment.component.ts - Block Calendar specific methods
  initBlockCalendarForm() {
    this.blockCalendarForm = this.fb.group({
      leaveDetails: ['', [Validators.required, Validators.minLength(10)]],
      doctor: [null, Validators.required], // null means "All Doctors"
      blockType: ['allDay', Validators.required],
      fromDate: [new Date(), Validators.required],
      toDate: [new Date(), Validators.required],
      date: [new Date(), Validators.required],
      startTime: [new Date(), Validators.required],
      endTime: [new Date(), Validators.required],
      blockVideo: [false],
      blockInClinic: [false]
    });

    // SET INITIAL VALIDATOR - This was missing!
    this.blockCalendarForm.setValidators([this.atLeastOneBlockTypeValidator()]);

    // Watch for changes in fromDate
    this.blockCalendarForm.get('fromDate')?.valueChanges.subscribe((fromDate) => {
      const toDate = this.blockCalendarForm.get('toDate')?.value;
      if (fromDate && toDate && new Date(toDate) < new Date(fromDate)) {
        this.blockCalendarForm.get('toDate')?.setValue(fromDate);
      }
      setTimeout(() => this.validateDateRange(), 100);
    });

    // Watch for changes in toDate
    this.blockCalendarForm.get('toDate')?.valueChanges.subscribe(() => {
      setTimeout(() => this.validateDateRange(), 100);
    });

    // Watch for doctor changes
    this.blockCalendarForm.get('doctor')?.valueChanges.subscribe(doctorValue => {
      if (doctorValue === null) {
        // All Doctors selected - ensure validator is set
        this.blockCalendarForm.setValidators([this.atLeastOneBlockTypeValidator()]);
      } else {
        // Specific doctor selected - remove validator
        this.blockCalendarForm.clearValidators();
      }
      this.blockCalendarForm.updateValueAndValidity();
    });

    // Watch for block type changes to re-validate
    this.blockCalendarForm.get('blockVideo')?.valueChanges.subscribe(() => {
      this.blockCalendarForm.updateValueAndValidity();
    });

    this.blockCalendarForm.get('blockInClinic')?.valueChanges.subscribe(() => {
      this.blockCalendarForm.updateValueAndValidity();
    });

    // Time validation
    this.blockCalendarForm.get('startTime')?.valueChanges.subscribe(() => {
      this.validateTimeRange();
    });
    this.blockCalendarForm.get('endTime')?.valueChanges.subscribe(() => {
      this.validateTimeRange();
    });
  }
  // Update your existing validateTimeRange method
  validateTimeRange() {
    const blockType = this.blockCalendarForm.get('blockType')?.value;
    if (blockType !== 'blockSlot') return;

    const startTime = this.blockCalendarForm.get('startTime')?.value;
    const endTime = this.blockCalendarForm.get('endTime')?.value;

    if (startTime && endTime) {
      this.showScheduleWarning = startTime >= endTime;
    }
  }

  validateDateRange() {
    const fromDateControl = this.blockCalendarForm?.get('fromDate');
    const toDateControl = this.blockCalendarForm?.get('toDate');
    
    if (!fromDateControl || !toDateControl) return;
    
    const fromDate = fromDateControl.value;
    const toDate = toDateControl.value;
    
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      
      // Reset time for accurate comparison
      from.setHours(0, 0, 0, 0);
      to.setHours(0, 0, 0, 0);
      
      console.log('Validating dates:', { from, to }); // Debug log
      
      if (to < from) {
        console.log('To date is before from date'); // Debug log
        // Set error on toDate control
        const currentErrors = toDateControl.errors || {};
        toDateControl.setErrors({ ...currentErrors, invalidDateRange: true });
      } else {
        console.log('Dates are valid'); // Debug log
        // Clear only the invalidDateRange error
        const currentErrors = toDateControl.errors;
        if (currentErrors && currentErrors['invalidDateRange']) {
          delete currentErrors['invalidDateRange'];
          const hasOtherErrors = Object.keys(currentErrors).length > 0;
          toDateControl.setErrors(hasOtherErrors ? currentErrors : null);
        }
      }
    }
  }
// Custom validators
futureDateValidator() {
  return (control: any) => {
    if (!control.value) return null;
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return { pastDate: true };
    }
    return null;
  };
}
atLeastOneBlockTypeValidator() {
    return (formGroup: any) => {
      const blockVideo = formGroup.get('blockVideo')?.value;
      const blockInClinic = formGroup.get('blockInClinic')?.value;
      const doctor = formGroup.get('doctor')?.value;
      
      // Only validate if "All Doctors" is selected
      if (doctor === null && !blockVideo && !blockInClinic) {
        return { atLeastOneBlockType: true };
      }
      return null;
    };
  }
  setActiveTab(tab: 'appointment' | 'reminder' | 'blockCalendar') {
    this.activeTab = tab;
  }

  initForm() {
  if (this.isDoctor && !this.editAppointment) {
    const scheduledDate = this.selectedDate == null ? new Date() : new Date(this.selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const formScheduledDate = new Date(scheduledDate);
    formScheduledDate.setHours(0, 0, 0, 0);
    const isPast = formScheduledDate < today;

    this.appointmentForm = this.fb.group({
      patientName: ['', Validators.required],
      patientId: ['', Validators.required],
      mobileNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      emailId: ['', [Validators.email]],
      doctor: [''],
      category: [''],
      scheduledDate: [scheduledDate, Validators.required],
      scheduledTime: [scheduledDate, Validators.required],
      duration: [15],
      bookingType: ['offline'],
      plannedProcedures: [''],
      notes: [''],
      status: [{ value: 'Scheduled', disabled: !isPast }],
      appointmentStatus: [{ value: 'None', disabled: !isPast }],
    });

    this.appointmentForm.get('scheduledDate')?.valueChanges.subscribe((selectedDate: Date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const date = new Date(selectedDate);
      date.setHours(0, 0, 0, 0);

      const isPast = date < today;

      const statusControl = this.appointmentForm.get('status');
      const appointmentStatusControl = this.appointmentForm.get('appointmentStatus');

      if (isPast) {
        statusControl?.enable();
        appointmentStatusControl?.enable();
      } else {
        statusControl?.disable();
        appointmentStatusControl?.disable();
      }
    });
  }
  else if (this.editAppointment) {
    const category = this.categories.find(c => c.category_id == this.appointment.category_details?.category_id)
    const doctor = this.doctors.find(d => d.user_id === this.appointment.doctor_details?.doctor_id)
    var formattedTime = this.convertTo24Hour(this.appointment.appointment_time);
    this.appointmentForm = this.fb.group({
      doctor: [doctor],
      category: [category],
      scheduledDate: [new Date(this.appointment.appointment_date), Validators.required],
      scheduledTime: [new Date(this.appointment.appointment_date + 'T' + formattedTime), Validators.required],
      duration: [Number(this.appointment.duration)],
      bookingType: [this.appointment.booking_type],
      plannedProcedures: [this.appointment.planned_procedure],
      notes: [this.appointment.notes],
      status: [{ value: this.appointment.status, disabled: !this.editAppointment }],
      appointmentStatus: [{ value: this.appointment.appointment_status, disabled: !this.editAppointment }],
    });
  }
  else {
    this.appointmentForm = this.fb.group({
      doctor: ['', Validators.required],
      category: ['', Validators.required],
      scheduledDate: [new Date(), Validators.required],
      scheduledTime: [new Date(), Validators.required],
      duration: ['15'],
      bookingType: ['offline'],
      plannedProcedures: [''],
      notes: [''],
      status: [{ value: 'Scheduled', disabled: !this.editAppointment }],
      appointmentStatus: [{ value: 'None', disabled: !this.editAppointment }],
    });
  }
}

  convertTo24Hour(time12h: string): string {
    const [time, modifier] = time12h.split(' '); // Split time and AM/PM
    let [hours, minutes] = time.split(':').map(Number); // Extract hours and minutes

    if (modifier === 'PM' && hours !== 12) {
      hours += 12; // Convert PM hours (except 12 PM)
    } else if (modifier === 'AM' && hours === 12) {
      hours = 0; // Convert 12 AM to 00
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  showDialog(isEdit: boolean = false) {
    if (isEdit) {
      this.editAppointment = true;
    } else {
      this.editAppointment = false;
    }
    
    this.initAppointmentForm();
    
    if (this.patientCode) {
      this.appointmentForm.get('patientId')?.setValue(this.patientCode);
      this.getPatientDetails();
    }
    
    if (this.selectedDate && !isEdit) {
      if (this.appointmentForm) {
        this.appointmentForm.get('appointmentDate')?.setValue(this.selectedDate);
      }
    }
    
    this.display = true;
    
    // Check for blocks if doctor and date are already set (for edit mode)
    setTimeout(() => {
      const doctor = this.appointmentForm.get('doctor')?.value;
      const scheduledDate = this.appointmentForm.get('scheduledDate')?.value;
      
      console.log('Dialog opened, checking initial values:', { doctor, scheduledDate });
      
      if (doctor && scheduledDate) {
        console.log('Initial doctor and date found, checking blocks...');
        this.checkBlockCalendar();
      }
    }, 500); // Give more time for form to be populated in edit mode
  }

  getPatientDetails() {
    const patientId = this.appointmentForm.get('patientId')?.value;

    // Reset previous states
    this.paitentNotFound = false;
    this.showPatientDropdown = false;
    this.multiplePatients = [];

    if (!patientId) {
      this.appointmentForm.get('patientId')?.setErrors({ required: true });
      return;
    }

    this.loaderService.show();

    // First try by patient code
    this.userService.getPatient(patientId).subscribe({
      next: (response) => {
        this.loaderService.hide();
        if (response.data?.length > 0) {
          this.handlePatientResponse(response.data);
        } else {
          // If no results by code, try by mobile number
          this.searchByMobileNumber(patientId);
        }
      },
      error: (error) => {
        this.loaderService.hide();
        this.searchByMobileNumber(patientId);
      }
    });
  }

  private searchByMobileNumber(mobileNumber: string) {
    this.userService.getPatientByMobileNumber(mobileNumber).subscribe({
      next: (response) => {
        this.loaderService.hide();
        if (response.data) {
          this.handlePatientResponse([response.data]); // Wrap in array for consistency
        } else {
          this.handleNoPatientFound();
        }
      },
      error: (error) => {
        this.loaderService.hide();
        this.handleNoPatientFound();
      }
    });
  }

  private handlePatientResponse(patients: any[]) {
    if (patients.length === 1) {
      this.selectPatient(patients[0]);
    } else if (patients.length > 1) {
      this.multiplePatients = patients;
      this.showPatientDropdown = true;
    } else {
      this.handleNoPatientFound();
    }
  }

  private handleNoPatientFound() {
    this.paitentNotFound = true;
    this.appointmentForm.get('patientId')?.setErrors({ invalidPatient: true });
    this.resetPatientFields();
  }

  private resetPatientFields() {
    this.appointmentForm.patchValue({
      patientName: '',
      mobileNumber: '',
      emailId: ''
    });
    // Clear validation errors for these fields
    this.appointmentForm.get('patientName')?.setErrors(null);
    this.appointmentForm.get('mobileNumber')?.setErrors(null);
  }

  selectPatient(patient: any) {
    this.patient = patient;

    // Check which data structure we're dealing with
    if (patient.profile) {
      // First data structure
      this.appointmentForm.patchValue({
        patientName: patient.profile.first_name + " " + patient.profile.last_name,
        mobileNumber: patient.phone,
        emailId: patient.email
      });
    } else if (patient.user_profile_details && patient.user_profile_details.length > 0) {
      // Second data structure
      this.appointmentForm.patchValue({
        patientName: patient.user_profile_details[0].first_name + " " + patient.user_profile_details[0].last_name,
        mobileNumber: patient.phone,
        emailId: patient.email
      });
    }

    this.showPatientDropdown = false;
  }

  cancelAppointment() {
    this.display = false;
    this.editAppointment = false;
    this.appointment = null;
    this.clearBlockWarnings(); // Clear warnings when canceling
    this.initAppointmentForm();
  }

  cancelBlockCalendar() {
    this.display = false;
    this.initBlockCalendarForm();
  }

  onSubmit() {
    if (this.appointmentForm.valid) {
      const value = this.appointmentForm.value;
      if(!this.editAppointment){
        this.loaderService.show();
        this.appointmentService.createAppointment({
          patient_id: this.isDoctor ? this.patient.user_id : this.currentUser.user_id,
          booking_type: value.bookingType,
          status: 'Scheduled',
          appointment_status: 'None',
          doctor_id: value.doctor.user_id,
          category_id: value.category.category_id,
          appointment_date: format(new Date(value.scheduledDate), 'yyyy-MM-dd'),
          appointment_time: format(new Date(value.scheduledTime), 'hh:mm a'),
          duration: value.duration,
          planned_procedure: value.plannedProcedures,
          notes: value.notes,
        }).subscribe(res=>{
          this.initAppointmentForm();
          this.display = false;
          if(this.fromPatientsection){
            this.router.navigate(['/calendar'])
          }

          this.closeDialog.emit({isOpenPatientDialog:false});
        });
      }
      else{
        this.appointmentService.updateAppointment({
          id: this.appointment.id,
          patient_id: this.appointment.patient_details.patient_id,
          booking_type: value.bookingType,
          status: value.status,
          appointment_status: value.appointmentStatus,
          doctor_id: value.doctor == null ? null : value.doctor.user_id,
          category_id: value.category == null ? null : value.category.category_id,
          appointment_date: format(new Date(value.scheduledDate), 'yyyy-MM-dd'),
          appointment_time: format(new Date(value.scheduledTime), 'hh:mm a'),
          duration: value.duration,
          planned_procedure: value.plannedProcedures,
          notes: value.notes,
        }).subscribe(res => {
          this.display = false;
          this.editAppointment = false;
          this.appointment = null;
          this.initAppointmentForm();
          window.location.reload();
        });
      }
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.appointmentForm.controls).forEach(key => {
        const control = this.appointmentForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
    }

  }

  onBlockCalendarSubmit() {
  if (this.blockCalendarForm.valid) {
    const formValue = this.blockCalendarForm.value;
    
    const blockData = {
      leave_details: formValue.leaveDetails,
      doctor_id: formValue.doctor?.user_id || null,
      block_type: formValue.blockType,
      ...(formValue.blockType === 'allDay' ? {
        fromDate: format(new Date(formValue.fromDate), 'yyyy-MM-dd'),
        toDate: format(new Date(formValue.toDate), 'yyyy-MM-dd')
      } : {
        date: format(new Date(formValue.date), 'yyyy-MM-dd'),
        startTime: format(new Date(formValue.startTime), 'HH:mm'),
        endTime: format(new Date(formValue.endTime), 'HH:mm')
      }),
      blockVideo: formValue.blockVideo,
      blockInClinic: formValue.blockInClinic
    };

    this.appointmentService.createBlockCalendar(blockData).subscribe({
      next: (response) => {
        console.log('Block calendar created:', response);
        this.display = false;
        // Refresh calendar or show success message
      },
      error: (error) => {
        console.error('Error creating block calendar:', error);
        // Show error message
      }
    });
  }
}
get isAllDoctors(): boolean {
  return this.blockCalendarForm.get('doctor')?.value === null;
}
get hasBlockTypeError(): boolean {
  return this.blockCalendarForm.hasError('atLeastOneBlockType') && 
         this.blockCalendarForm.touched;
}
get isAllDay(): boolean {
  return this.blockCalendarForm.get('blockType')?.value === 'allDay';
}

openPatientDialog(){
    this.display = false;
    this.closeDialog.emit({isOpenPatientDialog:true});
  }
}