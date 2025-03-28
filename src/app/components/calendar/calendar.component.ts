// calendar.component.ts
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TabViewModule } from 'primeng/tabview';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';  // Change this line
import { DialogModule } from 'primeng/dialog';

import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { EventListComponent } from './event-list/event-list.component';
import { DialogService } from 'primeng/dynamicdialog';
import { AppointmentComponent } from '../appointment/appointment.component';
import { UserService } from '../../services/user.service';
import { forkJoin } from 'rxjs';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { Overlay, OverlayModule, OverlayRef } from '@angular/cdk/overlay';
import { EventPopoverComponent } from './event-popover/event-popover.component';
import { ComponentPortal } from '@angular/cdk/portal';
import { MessageService } from 'primeng/api';
import { CancelAppointmentDialogComponent } from './cancel-appointment-dialog';
import { AddProfileComponent } from '../patients-section/edit-profile/add-profile.component';
import { AppointmentsPrintComponent } from "./appointments-print/appointments-print.component";

interface Doctor {
  id: string;
  name: string;
  color: string;
  appointments: number;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  providers: [DialogService, DatePipe, MessageService],
  imports: [
    CommonModule,
    DropdownModule,
    FormsModule,
    FullCalendarModule,
    ButtonModule,
    InputTextModule,
    TabViewModule,
    DividerModule,
    DialogModule,
    TagModule,
    CalendarModule,
    AppointmentComponent,
    OverlayModule,
    CancelAppointmentDialogComponent,
    AddProfileComponent,
    AppointmentsPrintComponent
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements OnInit {
  @ViewChild('myButton', { static: false }) myButton!: AppointmentComponent;
  @ViewChild('addPatientButton', { static: false }) addPatientButton!: AddProfileComponent;

  currentView: 'dayGridMonth' | 'timeGridDay' | 'timeGridWeek' = 'dayGridMonth';

  doctorsList: any[] = [];
  editAppointment: boolean = false;
  doctors: any[] = [];
  patients: any[] = [];
  currentUser: any;
  admins: any[] = [];
  categories: any[] = [];
  isAdmin: boolean = false;
  isDoctor: boolean = false;
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  addCategory: boolean = false;
  newCategory: string = '';
  isDataLoaded: boolean = false;
  private overlayRef: OverlayRef | null = null;
  activeTab!: 'all' | 'waiting' | 'engaged' | 'done';
  activeTabType!: 'all' | 'online' | 'offline';
  allAppointments: number = 0;
  waitingAppointemts: number = 0;
  engagedAppointemts: number = 0;
  doneAppointemts: number = 0;
  dayAppoinments: any[] = [];
  dayCounterAppoinments: any[] = [];
  isMouseOverPopover: boolean = false;
  hoverTimer: any = null;
  currentHoverEvent: any = null;
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    dayMaxEvents: 4,
    initialView: 'dayGridMonth',
    nowIndicator: true,
    editable: true,
    selectable: true,
    eventResizableFromStart: true, // Allow resizing from start
    dateClick: (info: DateClickArg) => {
      this.handleDateClick(info);
    },
    eventClassNames: (arg: any) => {
      return [`status-${arg.event.extendedProps.status}`];
    },
    moreLinkContent: (args: any) => {
      return `+${args.num} more`;
    },
    moreLinkClick: (args: { date: Date; allSegs: any[]; }) => {
      this.showEventList(args.date, args.allSegs.map(seg => seg.event));
      return 'list';
    },

    eventMouseEnter: (info) => {
      // Store the current event to track if mouse moved to another event
      this.currentHoverEvent = info.event;

      // Clear any existing timer to prevent multiple popovers
      if (this.hoverTimer) {
        clearTimeout(this.hoverTimer);
      }

      // Set a timer to show the popover after delay (1000ms = 1 second)
      this.hoverTimer = setTimeout(() => {
        // Only show if we're still hovering the same event
        if (this.currentHoverEvent === info.event) {
          this.showEventPopover(info.event, info.el);
        }
      }, 300);
    },
    // Add eventMouseLeave to close the popover when mouse leaves
    eventMouseLeave: (info) => {
      // Clear the hover timer if mouse leaves before the delay completes
      if (this.hoverTimer) {
        clearTimeout(this.hoverTimer);
        this.hoverTimer = null;
      }

      // Set the current hover event to null
      this.currentHoverEvent = null;

      // Add a small delay to prevent flickering when moving within the popover
      setTimeout(() => {
        if (!this.isMouseOverPopover) {
          this.closePopover();
        }
      }, 300);
    },
    headerToolbar: false,
    dayHeaderFormat: { weekday: 'short' },
    fixedWeekCount: false,
    height: '100%',
    slotMinTime: '05:00:00',
    slotMaxTime: '23:00:00',
    views: {
      dayGridMonth: {
        dayHeaderContent: (args) => {
          return {
            html: `
              <div class="fc-day-header">
                <span class="day-name">${args.text}</span>
              </div>
            `
          };
        }
      },
      timeGridDay: {
        dayHeaderContent: (args) => {
          return {
            html: `
              <div class="fc-day-header">
                <span class="day-name">${args.text}</span>
                <span class="day-date">${args.date.getDate()}</span>
              </div>
            `
          };
        }
      },
      timeGridWeek: {
        dayHeaderContent: (args) => {
          return {
            html: `
              <div class="fc-day-header">
                <span class="day-name">${args.text}</span>
                <span class="day-date">${args.date.getDate()}</span>
              </div>
            `
          };
        }
      }
    },
    eventContent: (arg) => {
      let extraClass = '';
      if (arg.event.title.includes('Not Available')) {
        extraClass = 'not-available-event';
      }
      return {
        html: `
          <div class="custom-event-content ${extraClass}">
            ${arg.event.extendedProps['isNew'] ? '<span class="new-indicator">N</span>' : ''}
            <span class="event-title">${arg.event.title}</span>
            ${this.currentView === 'timeGridDay' ?
            `<div class="event-details">
                <span class="event-time">${arg.timeText}</span>
                ${arg.event.extendedProps['category'] ?
              `<span class="event-category">${arg.event.extendedProps['category']}</span>` : ''}
              </div>` : ''}
          </div>
        `
      };
    },
    eventResize: this.handleEventResize.bind(this), // Handle resize event
  };
  selectedEvent: any = null;
  showCancelDialog: boolean = false;
  currentDate!: Date;
  dailyViewDate: Date = new Date();
  weeklyViewDate: Date = new Date();
  currentMonth: Date = new Date();
  searchText: string = '';
  searchCategory: string = '';
  firstDayOfMonth!: string;
  lastDayOfMonth!: string;
  selectedDoctor: string | null = null;
  selectedCategory: string | null = null;
  appointments: any[] = [];
  displayAddPatientDialog: boolean = false;
  uniqueCode: string = "";

  displayPrintAppointment = false;
  constructor(private dialogService: DialogService, private overlay: Overlay, private datePipe: DatePipe,
    private authService: AuthService, private messageService: MessageService, private userService: UserService, private appointmentService: AppointmentService) {

  }

  handleEventResize(eventResizeInfo: any) {

    console.log(eventResizeInfo);
    // const updatedEvent: EventApi = eventResizeInfo.event;
    // console.log('Event Resized:', updatedEvent.title, updatedEvent.start, updatedEvent.end);

    // // Update event in your data source (API/database)
    // this.events = this.events.map(event =>
    //   event.id === updatedEvent.id
    //     ? { ...event, start: updatedEvent.start.toISOString(), end: updatedEvent.end.toISOString() }
    //     : event
    // );
  }

  private handleDateClick(info: any) {
    // Get the clicked date
    const clickedDate = info.date;

    // Trigger the appointment component button
    if (this.myButton) {
      this.myButton.selectedDate = clickedDate;
      this.myButton.editAppointment = false; // Make sure we're in "add" mode, not "edit" mode

      // Call the method to show the appointment dialog
      this.myButton.patientCode = "";
      this.myButton.paitentNotFound = false;
      this.myButton.showDialog(false);
    }
  }

  handleDialogClose(event: any) {
    debugger;
    console.log("Parent detected dialog close!");
    // Handle any logic when the dialog closes
    this.changeView(this.currentView);

    this.uniqueCode = "";
    if (event.isOpenPatientDialog) {
      this.displayAddPatientDialog = true;
    }
  }

  savePatient(event: any) {
    debugger;
    this.displayAddPatientDialog = false;
    this.myButton.patientCode = event.unique_code;
    this.myButton.paitentNotFound = false;
    this.myButton.showDialog(false);
  }

  filteredDoctors() {
    return this.doctorsList.filter(doctor =>
      `${doctor.first_name} ${doctor.last_name}`.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  filteredCategories() {
    return this.categories.filter(category =>
      category.name.toLowerCase().includes(this.searchCategory.toLowerCase())
    );
  }
  private filterAppointments(appointments: any[]): any[] {
    if (this.isDoctor) {
      appointments = appointments.filter(a => a.doctor_details.doctor_id === this.currentUser.user_id);
    } else if (!this.isAdmin && !this.isDoctor) {
      appointments = appointments.filter(a => a.patient_details.patient_id === this.currentUser.user_id);
    }
    if (this.selectedDoctor !== null) {
      appointments = appointments.filter(a => a.doctor_details.doctor_id === this.selectedDoctor);
    }
    return appointments;
  }
  selectDoctor(doctor: any) {
    this.selectedDoctor = doctor.user_id;
    var docAppointments = this.appointments.filter(a => a.doctor_details?.doctor_id === doctor.user_id);
    var events: any[] = [];
    docAppointments.forEach((a: any) => {
      //const doctor = this.doctors.find(d => d.user_id === a.doctor_details.doctor_id)
      //const patient = this.patients.find(p => p.user_id === a.patient_id)
      const formattedTime = this.convertTo24Hour(a.appointment_time);
      const startDateTime = new Date(`${a.appointment_date}T${formattedTime}`);
      events.push({
        title: this.isDoctor || this.isAdmin ? a.patient_details.user_profile_details[0].first_name
          //+ a.patient_details.user_profile_details[0].last_name 
          : a.doctor_details?.user_profile_details[0].first_name,
        start: startDateTime,
        allDay: false,
        extendedProps: {
          status: 'unavailable',
          patientCode: a.patient_details.unique_code,
          patientId: a.patient_details.patient_id,
          patientName: a.patient_details.user_profile_details[0].first_name + ' ' + a.patient_details.user_profile_details[0].last_name,
          phone: '+91 ' + a.patient_details.phone,
          email: a.patient_details.email,
          doctor: doctor.name,
          duration: a.duration + ' mins',
          appointmentTime: a.appointment_time,
          bookingType: a.booking_type === 'Offline' ? 'In-Clinic' : 'Online',
          category: a.category_details.name,
          notes: a.notes,
          appointmentId: a.id
        }
      })
    });
    this.selectedCategory = null;
    this.calendarOptions.events = events;
  }
  selectCategory(category: any) {
    var docAppointments = this.appointments.filter(a => a.category_details?.category_id === category.category_id);
    var events: any[] = [];
    docAppointments.forEach((a: any) => {
      //const doctor = this.doctors.find(d => d.user_id === a.doctor_details.doctor_id)
      //const patient = this.patients.find(p => p.user_id === a.patient_id)
      const formattedTime = this.convertTo24Hour(a.appointment_time);
      const startDateTime = new Date(`${a.appointment_date}T${formattedTime}`);
      events.push({
        title: this.isDoctor || this.isAdmin ? a.patient_details.user_profile_details[0].first_name
          //+ a.patient_details.user_profile_details[0].last_name 
          : a.doctor_details?.user_profile_details[0].first_name,
        //+ a.doctor_details.user_profile_details[0].last_name,
        start: startDateTime,
        allDay: false,
        extendedProps: {
          status: 'unavailable',
          patientCode: a.patient_details.unique_code,
          patientId: a.patient_details.patient_id,
          patientName: a.patient_details.user_profile_details[0].first_name + ' ' + a.patient_details.user_profile_details[0].last_name,
          phone: '+91 ' + a.patient_details.phone,
          email: a.patient_details.email,
          doctor: a.doctor_details ? (a.doctor_details?.user_profile_details[0].first_name + ' ' + a.doctor_details?.user_profile_details[0].last_name) : null,
          duration: a.duration + ' mins',
          appointmentTime: a.appointment_time,
          bookingType: a.booking_type === 'Offline' ? 'In-Clinic' : 'Online',
          category: a.category_details.name,
          notes: a.notes,
          appointmentId: a.id
        }
      })
    });
    this.calendarOptions.events = events;
    this.selectedCategory = category.category_id;
  }
  ngOnInit() {
    this.currentDate = new Date();
    this.activeTab = 'all'
    this.activeTabType = 'all'
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const firstDay = new Date(year, month, -6);
    this.firstDayOfMonth = this.formatDateToYYYYMMDD(firstDay);

    const lastDay = new Date(year, month + 1, 6);
    this.lastDayOfMonth = this.formatDateToYYYYMMDD(lastDay);
    forkJoin({
      doctors: this.userService.getDoctors('bce9f008-d447-4fe2-a29e-d58d579534f0'),
      patients: this.userService.getDoctors('2ac7787b-77d1-465b-9bc0-eee50933697f'),
      categories: this.userService.getCategories(),
      currentUser: this.authService.getUser(),
      appointments: this.appointmentService.getAppointments(firstDay, lastDay),
      admins: this.userService.getDoctors('486320ca-8dc7-45bb-a42a-0fc0c3bb3156'),
    }).subscribe({
      next: ({ doctors, patients, categories, currentUser, appointments, admins }) => {
        this.admins = admins.data;
        this.currentUser = currentUser.data;
        var admin = this.admins.find(a => a.user_id === currentUser.data.user_id);
        if (admin !== undefined) {
          this.isAdmin = true;
        }

        this.doctorsList = doctors.data;
        this.patients = patients.data;
        this.doctorsList.forEach(doc => {
          this.doctors.push({
            name: doc.first_name + " " + doc.last_name,
            user_id: doc.user_id
          });
        });
        if (!this.isAdmin) {
          const doctor = this.doctors.find(a => a.user_id === currentUser.data.user_id);
          if (doctor !== undefined)
            this.isDoctor = true;
        }
        this.categories = categories.data;
        this.addAppointmentsToCalendar(appointments);
        this.changeDate(0);
        this.isDataLoaded = true
      },
      error: (err) => {
        console.error('Error fetching data:', err);
      }
    });
  }

  changeDate(days: number): void {
    const updatedDate = new Date(this.currentDate);
    updatedDate.setDate(this.currentDate.getDate() + days);
    this.currentDate = updatedDate;

    // if (this.currentView === 'timeGridDay') {
    //   const calendarApi = this.calendarComponent.getApi();
    //   calendarApi.gotoDate(this.currentDate);
    // }

    const counterDate = this.datePipe.transform(this.currentDate, 'yyyy-MM-dd') || '';
    this.appointmentService.getAppointments(counterDate, counterDate).subscribe(apps => {
      const dAppointments: any[] = apps.data.rows;
      this.filterAppointments(dAppointments);
      this.createDayappointment(dAppointments);
    });
  }

  changeMonth(direction: number) {
    const updatedMonth = new Date(this.currentMonth);
    updatedMonth.setMonth(this.currentMonth.getMonth() + direction);
    this.currentMonth = updatedMonth;
    const calendarApi = this.calendarComponent.getApi();
    if (direction === -1) {
      calendarApi.prev();
    } else if (direction === 1) {
      calendarApi.next();
    }
    this.updateMonthRange();
  }

  changeDailyViewDate(direction: number) {
    const updatedDate = new Date(this.dailyViewDate);
    updatedDate.setDate(this.dailyViewDate.getDate() + direction);
    this.dailyViewDate = updatedDate;
    const calendarApi = this.calendarComponent.getApi();
    calendarApi.gotoDate(this.dailyViewDate);
    const firstDay = this.formatDateToYYYYMMDD(this.dailyViewDate)
    this.appointmentService.getAppointments(firstDay, firstDay).subscribe(appointments => {
      this.addAppointmentsToCalendar(appointments);
    });
  }

  assignDoctor(app: any) {
    debugger;
    this.myButton.editAppointment = true;
    this.myButton.appointementId = app.appointmentId;
    this.myButton.appointment = this.appointments.filter(a => a.id === app.appointmentId)[0];
    this.myButton.showDialog(true);
  }

  private updateMonthRange(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const firstDay = new Date(year, month, -6);
    this.firstDayOfMonth = this.formatDateToYYYYMMDD(firstDay);

    const lastDay = new Date(year, month + 1, 6);
    this.lastDayOfMonth = this.formatDateToYYYYMMDD(lastDay);
    this.appointmentService.getAppointments(firstDay, lastDay).subscribe(appointments => {
      this.addAppointmentsToCalendar(appointments);
    });
  }

  private formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  filterDayCounterAppointments(counterType: 'all' | 'waiting' | 'engaged' | 'done') {
    if (this.activeTabType === 'all') {
      this.allAppointments = this.dayAppoinments.length;
      this.waitingAppointemts = this.dayAppoinments.filter(a => a.appointment_status.toLowerCase() === 'waiting').length;
      this.engagedAppointemts = this.dayAppoinments.filter(a => a.appointment_status.toLowerCase() === 'engaged').length;
      this.doneAppointemts = this.dayAppoinments.filter(a => a.appointment_status.toLowerCase() === 'done').length;
      if (counterType === 'all') {
        this.dayCounterAppoinments = this.dayAppoinments;
      }
      else {
        this.dayCounterAppoinments = this.dayAppoinments.filter(a => a.appointment_status.toLowerCase() === counterType);
      }
    }
    else {
      this.allAppointments = this.dayAppoinments.filter(a => a.booking_type === this.activeTabType).length;
      this.waitingAppointemts = this.dayAppoinments.filter(a => a.appointment_status.toLowerCase() === 'waiting' && a.booking_type === this.activeTabType).length;
      this.engagedAppointemts = this.dayAppoinments.filter(a => a.appointment_status.toLowerCase() === 'engaged' && a.booking_type === this.activeTabType).length;
      this.doneAppointemts = this.dayAppoinments.filter(a => a.appointment_status.toLowerCase() === 'done' && a.booking_type === this.activeTabType).length;
      if (counterType === 'all') {
        this.dayCounterAppoinments = this.dayAppoinments.filter(a => a.booking_type === this.activeTabType);
      }
      else {
        this.dayCounterAppoinments = this.dayAppoinments.filter(a => a.appointment_status.toLowerCase() === counterType && a.booking_type === this.activeTabType);
      }
    }
    this.activeTab = counterType;
  }

  filterDayAppointments(counter: 'all' | 'online' | 'offline') {
    if (counter === 'all') {
      this.dayCounterAppoinments = this.dayAppoinments;
    }
    else {
      this.dayCounterAppoinments = this.dayAppoinments.filter(a => a.booking_type === counter);
    }
    this.allAppointments = this.dayCounterAppoinments.length;
    this.waitingAppointemts = this.dayCounterAppoinments.filter(a => a.appointment_status.toLowerCase() === 'waiting').length;
    this.engagedAppointemts = this.dayCounterAppoinments.filter(a => a.appointment_status.toLowerCase() === 'engaged').length;
    this.doneAppointemts = this.dayCounterAppoinments.filter(a => a.appointment_status.toLowerCase() === 'done').length;
    this.activeTab = 'all';
    this.activeTabType = counter;
  }

  createDayappointment(dAppointments: any[]) {
    dAppointments = dAppointments.filter(a => a.booking_type !== 'Invalid date');
    this.dayAppoinments = [];
    dAppointments.forEach(a => {
      //const doctor = this.doctors.find(d => d.user_id === a.doctor_id);
      //const patient = this.patients.find(p => p.user_id === a.patient_id);
      this.dayAppoinments.push({
        appointmentId: a.id,
        appointmentTime: a.appointment_time,
        patientName: a.patient_details.user_profile_details[0].first_name + ' ' + a.patient_details.user_profile_details[0].last_name,
        doctor: a.doctor_details ? (a.doctor_details?.user_profile_details[0].first_name + ' ' + a.doctor_details?.user_profile_details[0].last_name) : null,
        booking_type: a.booking_type,
        appointment_status: a.appointment_status,
        notes: a.notes
      })
    })
    this.filterDayAppointments('all');
    this.activeTab = 'all'
    this.activeTabType = 'all'
  }

  addAppointmentsToCalendar(appointments: any) {
    var events: any[] = [];
    var dAppointments: any[] = appointments.data.rows;
    this.appointments = appointments.data.rows;
    if (this.isDoctor) {
      dAppointments = dAppointments.filter(a => a.doctor_details.doctor_id === this.currentUser.user_id)
    } else if (!this.isAdmin && !this.isDoctor) {
      dAppointments = dAppointments.filter(a => a.patient_details.patient_id === this.currentUser.user_id)
    }
    if (this.selectedDoctor !== null) {
      dAppointments = dAppointments.filter(a => a.doctor_details.doctor_id === this.selectedDoctor)
    }

    dAppointments.forEach((a: any) => {
      //const doctor = this.doctors.find(d => d.user_id === a.doctor_id)
      //const patient = this.patients.find(p => p.user_id === a.patient_id)
      const formattedTime = this.convertTo24Hour(a.appointment_time);
      const startDateTime = new Date(`${a.appointment_date}T${formattedTime}`);
      const endDateTime = new Date(startDateTime);
      const minutesToAdd = Number(a.duration); // replace with your desired duration
      endDateTime.setMinutes(startDateTime.getMinutes() + minutesToAdd);
      events.push({
        title: this.isDoctor || this.isAdmin ? a.patient_details.user_profile_details[0].first_name
          //+ a.patient_details.user_profile_details[0].last_name 
          : a.doctor_details?.user_profile_details[0].first_name,
        //+ a.doctor_details.user_profile_details[0].last_name,
        start: startDateTime,
        end: endDateTime,
        allDay: false,
        extendedProps: {
          status: 'unavailable',
          patientCode: a.patient_details.unique_code,
          patientId: a.patient_details.patient_id,
          patientName: a.patient_details.user_profile_details[0].first_name + ' ' + a.patient_details.user_profile_details[0].last_name,
          phone: '+91 ' + a.patient_details.phone,
          email: a.patient_details.email,
          doctor: a.doctor_details ? (a.doctor_details?.user_profile_details[0].first_name + ' ' + a.doctor_details?.user_profile_details[0].last_name) : null,
          duration: a.duration + ' mins',
          appointmentTime: a.appointment_time,
          bookingType: a.booking_type === 'Offline' ? 'In-Clinic' : 'Online',
          category: a.category_details?.name,
          notes: a.notes,
          appointmentId: a.id
        }
      })
    });
    this.calendarOptions.events = events;
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
  toggleAddCategory() {
    this.addCategory = !this.addCategory;
  }
  private showEventPopover(event: any, element: HTMLElement) {
    this.closePopover();

    // If the event is no longer the current hover event, don't show popover
    if (this.currentHoverEvent !== event) {
      return;
    }

    // Create overlay position strategy
    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(element)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 8 // Add some space for the arrow
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
          offsetY: -8 // Add some space for the arrow when showing above
        }
      ]);

    // Create overlay
    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: false, // Changed to false - no backdrop for hover
      backdropClass: 'transparent-backdrop',
      panelClass: 'event-popover-panel'
    });

    // Create and attach component
    const componentPortal = new ComponentPortal(EventPopoverComponent);
    const componentRef = this.overlayRef.attach(componentPortal);

    // Set component inputs and outputs
    componentRef.instance.event = event;

    // Add mouse enter/leave handlers for the popover itself
    componentRef.instance.mouseEnter.subscribe(() => {
      this.isMouseOverPopover = true;
    });
    componentRef.instance.mouseLeave.subscribe(() => {
      this.isMouseOverPopover = false;
      this.closePopover();
    });

    componentRef.instance.close.subscribe(() => this.closePopover());
    componentRef.instance.edit.subscribe((evt) => this.handleEventEdit(evt));
    componentRef.instance.delete.subscribe((evt) => this.handleEventDelete(evt));
  }

  private closePopover() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  private handleEventEdit(event: any) {
    this.myButton.editAppointment = true;
    this.myButton.appointementId = event.extendedProps.appointmentId;
    this.myButton.appointment = this.appointments.filter(a => a.id === event.extendedProps.appointmentId)[0];
    this.myButton.showDialog(true);
  }

  private handleEventDelete(event: any) {
    this.selectedEvent = event;
    this.showCancelDialog = true;
  }
  onCancelDialogClose() {
    this.showCancelDialog = false;
  }

  onCancelAppointmentConfirm(cancelData: any) {
    // First, close the dialog
    this.showCancelDialog = false;

    // Close any open popover
    this.closePopover();

    this.appointmentService.deleteAppointment(cancelData).subscribe({
      next: (response) => {
        window.location.reload();
      },
      error: (error) => {
        console.error('Error cancelling appointment:', error);
        this.showMessage('error', 'Error', 'Failed to cancel the appointment. Please try again.');
      }
    });
  }
  private showMessage(severity: string, summary: string, detail: string) {
    // If you're using PrimeNG MessageService
    if (this.messageService) {
      this.messageService.add({ severity, summary, detail });
    } else {
      // Fallback to console
      console.log(`${severity}: ${summary} - ${detail}`);
    }
  }
  saveCategory() {
    if (this.newCategory.trim()) {
      this.userService.addCategory(this.newCategory).subscribe(res => {
        this.userService.getCategories().subscribe(categories => {
          this.categories = categories.data;
        })
        this.toggleAddCategory();
      })
    }
  }

  showEventList(date: Date, events: any[]) {
    const ref = this.dialogService.open(EventListComponent, {
      data: { date, events },
      header: 'Appointments',
      width: '30rem',
      contentStyle: { "max-height": "500px", "overflow": "auto" }
    });

    // Listen for the emitted event
    ref.onClose.subscribe((event) => {
      if (event) {
        this.myButton.editAppointment = true;
        this.myButton.appointementId = event.extendedProps.appointmentId;
        this.myButton.appointment = this.appointments.filter(a => a.id === event.extendedProps.appointmentId)[0];
        this.myButton.showDialog(true);
      }
    });
  }
  private renderEventContent(eventInfo: any) {
    // Custom event rendering
    const hasNewIndicator = eventInfo.event.extendedProps.isNew;
    return {
      html: `
        <div class="custom-event-content">
          ${hasNewIndicator ? '<span class="new-indicator">N</span>' : ''}
          <span class="event-title">${eventInfo.event.title}</span>
        </div>
      `
    };
  }

  todayAppointments = [
    {
      time: '9:00 AM',
      patientName: 'John Doe',
      reason: 'Dental Check-up',
      doctor: 'Smith'
    },
    // Add more appointments...
  ];

  changeView(viewName: 'dayGridMonth' | 'timeGridDay' | 'timeGridWeek') {
    this.currentView = viewName;
    const calendarApi = this.calendarComponent.getApi();
    calendarApi.changeView(viewName);

    // Update the current date based on the view
    if (viewName === 'timeGridDay') {
      this.dailyViewDate = calendarApi.getDate();
    } else if (viewName === 'timeGridWeek') {
      this.weeklyViewDate = calendarApi.getDate();
    }

    if (viewName === 'dayGridMonth') {
      this.updateMonthRange();
    } else if (viewName === 'timeGridWeek') {
      this.updateWeekRange();
    }
    else {
      this.changeDailyViewDate(0);
    }
  }

  changeWeeklyViewDate(direction: number) {
    const updatedDate = new Date(this.weeklyViewDate);
    updatedDate.setDate(this.weeklyViewDate.getDate() + direction * 7);
    this.weeklyViewDate = updatedDate;
    const calendarApi = this.calendarComponent.getApi();
    calendarApi.gotoDate(this.weeklyViewDate);

    // Update appointments for the new week range
    this.updateWeekRange();
  }

  // Add method to update week range and fetch appointments
  private updateWeekRange(): void {
    // Calculate first day (Sunday) and last day (Saturday) of the current week
    const currentDate = new Date(this.weeklyViewDate);
    const day = currentDate.getDay();

    const firstDay = new Date(currentDate);
    firstDay.setDate(currentDate.getDate() - day);

    const lastDay = new Date(currentDate);
    lastDay.setDate(currentDate.getDate() + (6 - day));

    const firstDayFormatted = this.formatDateToYYYYMMDD(firstDay);
    const lastDayFormatted = this.formatDateToYYYYMMDD(lastDay);

    // Fetch appointments for the week
    this.appointmentService.getAppointments(firstDayFormatted, lastDayFormatted).subscribe(appointments => {
      this.addAppointmentsToCalendar(appointments);
    });
  }

  getWeekStartDate(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    // Calculate days to subtract to get to Sunday
    result.setDate(result.getDate() - day);
    return result;
  }

  // Get week end date (Saturday)
  getWeekEndDate(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    // Calculate days to add to get to Saturday
    result.setDate(result.getDate() + (6 - day));
    return result;
  }

  showPrintAppointment() {
    this.displayPrintAppointment = true;
  }
}