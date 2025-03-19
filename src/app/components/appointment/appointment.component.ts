// appointment.component.ts
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
  status: string[] = ["Scheduled", "Completed", "Canceled", "Rescheduled"];
  appointmentStatus: string[] = ['None', 'Waiting', 'Engaged', 'Done'];
  showScheduleWarning: boolean = false;
  public selectedDate: any;

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
  
  constructor(private fb: FormBuilder, private router: Router, private userService: UserService, private appointmentService: AppointmentService) {}

  ngOnInit() {
    this.activeTab = this.data;
    this.initAppointmentForm();
    this.initBlockCalendarForm();
  }

  initAppointmentForm() {
    this.initForm()
  }

  initBlockCalendarForm() {
    this.blockCalendarForm = this.fb.group({
      leaveDetails: ['', Validators.required],
      doctor: ['', Validators.required],
      blockType: ['blockSlot', Validators.required],
      date: [new Date('2025-02-01'), Validators.required],
      startTime: [new Date('2025-02-01T11:25:00'), Validators.required],
      endTime: [new Date('2025-02-01T11:25:00'), Validators.required],
      blockVideo: [false],
      blockInClinic: [true]
    });

    // Monitor time changes
    this.blockCalendarForm.get('startTime')?.valueChanges.subscribe(() => {
      this.validateTimeRange();
    });
    this.blockCalendarForm.get('endTime')?.valueChanges.subscribe(() => {
      this.validateTimeRange();
    });
  }

  validateTimeRange() {
    const startTime = this.blockCalendarForm.get('startTime')?.value;
    const endTime = this.blockCalendarForm.get('endTime')?.value;
    
    if (startTime && endTime) {
      this.showScheduleWarning = startTime >= endTime;
    }
  }

  setActiveTab(tab: 'appointment' | 'reminder' | 'blockCalendar') {
    this.activeTab = tab;
  }

  onBlockCalendarSubmit() {
    if (this.blockCalendarForm.valid) {
      console.log(this.blockCalendarForm.value);
      this.display = false;
    } else {
      Object.keys(this.blockCalendarForm.controls).forEach(key => {
        const control = this.blockCalendarForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }

  initForm() {
    if(this.isDoctor && !this.editAppointment){
      this.appointmentForm = this.fb.group({
        patientName: ['', Validators.required],
        patientId: ['', Validators.required],
        mobileNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
        emailId: ['', [Validators.email]],
        doctor: ['', Validators.required],
        category: ['', Validators.required],
        scheduledDate: [this.selectedDate == null ? new Date() : new Date(this.selectedDate), Validators.required],
        scheduledTime: [this.selectedDate == null ? new Date() : new Date(this.selectedDate), Validators.required],
        duration: ['15'],
        bookingType: ['offline'],
        plannedProcedures: [''],
        notes: [''],
        status:[{ value: 'Scheduled', disabled: !this.editAppointment }],
        appointmentStatus:[{ value: 'None', disabled: !this.editAppointment }],
      });
    } else if (this.editAppointment){
      const category = this.categories.find(c => c.category_id == this.appointment.category_details.category_id)
      const doctor = this.doctors.find(d => d.user_id === this.appointment.doctor_details.doctor_id)
      var formattedTime = this.convertTo24Hour(this.appointment.appointment_time);
      this.appointmentForm = this.fb.group({
        doctor: [doctor, Validators.required],
        category: [category, Validators.required],
        scheduledDate: [new Date(this.appointment.appointment_date), Validators.required],
        scheduledTime: [new Date(this.appointment.appointment_date +'T'+ formattedTime), Validators.required],
        duration: [this.appointment.duration],
        bookingType: [this.appointment.booking_type],
        plannedProcedures: [this.appointment.planned_procedure],
        notes: [this.appointment.notes],
        status:[{ value: this.appointment.status, disabled: !this.editAppointment }],
        appointmentStatus:[{ value: this.appointment.appointment_status, disabled: !this.editAppointment }],
      });
    }
    else{
      this.appointmentForm = this.fb.group({
        doctor: ['', Validators.required],
        category: ['', Validators.required],
        scheduledDate: [new Date(), Validators.required],
        scheduledTime: [new Date(), Validators.required],
        duration: ['15'],
        bookingType: ['offline'],
        plannedProcedures: [''],
        notes: [''],
        status:[{ value: 'Scheduled', disabled: !this.editAppointment }],
        appointmentStatus:[{ value: 'None', disabled: !this.editAppointment }],
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
    if(isEdit)
      {this.editAppointment = true;
      }
    else{this.editAppointment = false}
    this.initAppointmentForm();
    if(this.patientCode){
      this.appointmentForm.get('patientId')?.setValue(this.patientCode)
      this.getPatientDetails();
    }
    if (this.selectedDate && !isEdit) {
      // Set the appointment date in your form or model
      // This will depend on how your appointment component is structured
      // For example:
      if (this.appointmentForm) {
        this.appointmentForm.get('appointmentDate')?.setValue(this.selectedDate);
      }
    }
    this.display = true;
  }

  getPatientDetails() {
    var code = this.appointmentForm.value.patientId
    if(code == undefined || code == '') return;
    this.userService.getPatient(code).subscribe(response => {
      this.patient = response.data;
      this.appointmentForm.patchValue({
        patientName: this.patient.profile.first_name + " " + this.patient.profile.last_name,
        mobileNumber: this.patient.phone,
        emailId: this.patient.email
      });
    })
  }
  cancelAppointment(){
    this.display = false;
    this.editAppointment = false;
    this.appointment = null;
    this.initAppointmentForm();
  }
  onSubmit() {
    if (this.appointmentForm.valid) {
      const value = this.appointmentForm.value;
      if(!this.editAppointment){
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
        });
      }
      else{
        this.appointmentService.updateAppointment({
          id: this.appointment.id,
          patient_id: this.appointment.patient_details.patient_id,
          booking_type: value.bookingType,
          status: value.status,
          appointment_status: value.appointmentStatus,
          doctor_id: value.doctor.user_id,
          category_id: value.category.category_id,
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
      Object.keys(this.appointmentForm.controls).forEach(key => {
        const control = this.appointmentForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
    
  }

  openPatientDialog(){
    this.display = false;
  }

  onDialogClose() {
    this.closeDialog.emit({isOpenPatientDialog:true}); // Notify parent
  }
}