// calendar.component.ts
import { Component, ElementRef, OnInit, Output, ViewChild } from '@angular/core';
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
import { HostListener } from '@angular/core';
import { DoctorColorService } from '../../services/doctor-color.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
interface Doctor {
  id: string;
  name: string;
  color: string;
  appointments: number;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  providers: [DialogService, DatePipe, MessageService, ConfirmationService],
  imports: [
    CommonModule,
    ConfirmDialogModule,
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
    AppointmentsPrintComponent,
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements OnInit {
  @ViewChild('myButton', { static: false }) myButton!: AppointmentComponent;
  @ViewChild('addPatientButton', { static: false }) addPatientButton!: AddProfileComponent;

  currentView: 'dayGridMonth' | 'timeGridDay' | 'timeGridWeek' = 'dayGridMonth';

  doctorsList: any[] = [];
  blockCalendarEvents: any[] = []; 
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
      const doctorId = arg.event.extendedProps?.doctorId || arg.event.extendedProps?.doctor_id || arg.event.extendedProps?.doctor;
      const colorClass = doctorId ? `doctor-bg-${this.getDoctorColor(doctorId)}` : '';
      let viewClass = '';
      if (this.currentView === 'dayGridMonth') viewClass = 'month-view';
      else if (this.currentView === 'timeGridWeek') viewClass = 'week-view';
      else viewClass = 'day-view';
      return [`status-${arg.event.extendedProps.status}`, colorClass, viewClass];
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
        
        if (this.hoverTimer) {
          clearTimeout(this.hoverTimer);
        }

        this.hoverTimer = setTimeout(() => {
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
      if (arg.event.extendedProps['type'] === 'block_calendar') {
        return {
          html: `
            <div class="custom-event-content block-event">
              <i class="pi pi-ban"></i>
              <span class="event-title">${arg.event.title}</span>
              ${this.currentView !== 'dayGridMonth' ? 
                `<div class="block-details">
                  <span class="block-reason">${arg.event.extendedProps['leaveDetails']}</span>
                </div>` : ''}
            </div>
          `
        };
      }
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
  practices: any[] = [];
  selectedPractice: any;
  showPracticesDropdown: boolean = false;
  practiceSearchText: string = '';
  filteredPractices: any[] = [];
  displayPrintAppointment = false;
  doctorColorMap: { [doctorId: string]: string } = {};
  constructor(private dialogService: DialogService, private overlay: Overlay, private datePipe: DatePipe, private elementRef: ElementRef,
    private authService: AuthService, private confirmationService: ConfirmationService, private messageService: MessageService, private userService: UserService,  private doctorColorService: DoctorColorService, private appointmentService: AppointmentService) {

  }

  getDoctorColor(doctorId: string): string {
    return this.doctorColorService.getColorForDoctor(doctorId);
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
  
  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent) {
  if (this.showPracticesDropdown && 
      !this.elementRef.nativeElement.querySelector('.email-dropdown').contains(event.target)) {
    this.showPracticesDropdown = false;
  }
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
    console.log("Parent detected dialog close!");
    // Handle any logic when the dialog closes
    this.changeView(this.currentView);

    this.uniqueCode = "";
    if (event.isOpenPatientDialog) {
      this.displayAddPatientDialog = true;
    }
  }

  savePatient(event: any) {
    this.displayAddPatientDialog = false;
    this.myButton.patientCode = event.manual_unique_code;
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
      const doctor = this.doctorsList.find(d => d.user_id === a.doctor_details?.doctor_id);
      const colorClass = doctor ? doctor.colorClass : this.doctorColorMap[a.doctor_details?.doctor_id];
      events.push({
        title: this.isDoctor || this.isAdmin ? a.patient_details.user_profile_details[0].first_name
          //+ a.patient_details.user_profile_details[0].last_name 
          : a.doctor_details?.user_profile_details[0].first_name,
        start: startDateTime,
        allDay: false,
        extendedProps: {
          status: 'unavailable',
          patientCode: a.patient_details.manual_unique_code,
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
        },
        className: [
          `doctor-bg-${colorClass}`,
          this.currentView === 'dayGridMonth' ? 'month-view' : this.currentView === 'timeGridWeek' ? 'week-view' : 'day-view'
        ]
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
      const doctor = this.doctorsList.find(d => d.user_id === a.doctor_details?.doctor_id);
      const colorClass = doctor ? doctor.colorClass : this.doctorColorMap[a.doctor_details?.doctor_id];
      events.push({
        title: this.isDoctor || this.isAdmin ? a.patient_details.user_profile_details[0].first_name
          //+ a.patient_details.user_profile_details[0].last_name 
          : a.doctor_details?.user_profile_details[0].first_name,
        //+ a.doctor_details.user_profile_details[0].last_name,
        start: startDateTime,
        allDay: false,
        extendedProps: {
          status: 'unavailable',
          patientCode: a.patient_details.manual_unique_code,
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
        },
        className: [
          `doctor-bg-${colorClass}`,
          this.currentView === 'dayGridMonth' ? 'month-view' : this.currentView === 'timeGridWeek' ? 'week-view' : 'day-view'
        ]
      })
    });
    this.calendarOptions.events = events;
    this.selectedCategory = category.category_id;
  }
  ngOnInit() {
    this.userService.getBranches().subscribe(res=>{
      this.practices = res.data;
      const savedPractice = localStorage.getItem('selectedPractice');
      if (savedPractice) {
        this.selectedPractice = JSON.parse(savedPractice);
      } else {
        this.selectedPractice = this.practices[0];
        localStorage.setItem('selectedPractice', JSON.stringify(this.selectedPractice));
      }
      this.loadComponentData()
    })
  }

  loadComponentData(){
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
      blockCalendarEvents: this.appointmentService.getBlockCalendarByDateRange(this.firstDayOfMonth, this.lastDayOfMonth, this.selectedPractice?.branch_id)

    }).subscribe({
      next: ({ doctors, patients, categories, currentUser, appointments, admins, blockCalendarEvents }) => {
        this.admins = admins.data;
        this.currentUser = currentUser.data;
        var admin = this.admins.find(a => a.user_id === currentUser.data.user_id);
        if(this.currentUser.role_details.role_id === '486320ca-8dc7-45bb-a42a-0fc0c3bb3156') {
          this.isAdmin = true;
        }

        // Sort doctors by user_id for stable color assignment
        const sortedDoctors = doctors.data.slice().sort((a: any, b: any) => String(a.user_id).localeCompare(String(b.user_id)));
        const colorClasses = Object.keys(this.doctorColorService['colorDefinitions']);
        this.doctorsList = sortedDoctors.map((doc: any, idx: number) => {
          const colorClass = colorClasses[idx % colorClasses.length];
          this.doctorColorMap[doc.user_id] = colorClass;
          return {
            ...doc,
            colorClass
          };
        });
        this.patients = patients.data;
        this.doctorsList.forEach(doc => {
          this.doctors.push({
            name: doc.first_name + " " + doc.last_name,
            user_id: doc.user_id,
            colorClass: doc.colorClass
          });
        });
        if (!this.isAdmin) {
          const doctor = this.doctors.find(a => a.user_id === currentUser.data.user_id);
          if (doctor !== undefined)
            this.isDoctor = true;
        }
        this.categories = categories.data.rows;
        this.blockCalendarEvents = blockCalendarEvents.data.rows || [];
        this.addAppointmentsToCalendar(appointments);
        this.changeDate(0);
        this.isDataLoaded = true
      },
      error: (err) => {
        console.error('Error fetching data:', err);
      }
    });
  }

     goToToday(): void {
  const today = new Date();
  this.currentDate = today;

  const calendarApi = this.calendarComponent.getApi();
  calendarApi.gotoDate(today);

  switch (this.currentView) {
    case 'dayGridMonth':
      this.currentMonth = today;
      this.updateMonthRange(); 
      break;

    case 'timeGridWeek':
      this.weeklyViewDate = today;
      this.updateWeekRange(); 
      break;

    case 'timeGridDay':
      this.dailyViewDate = today;
      this.changeDailyViewDate(0);
      break;
  }
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
    
    const firstDay = this.formatDateToYYYYMMDD(this.dailyViewDate);
    
    forkJoin({
      appointments: this.appointmentService.getAppointments(firstDay, firstDay),
      blockEvents: this.appointmentService.getBlockCalendarByDateRange(firstDay, firstDay, this.selectedPractice?.branch_id)
    }).subscribe(({ appointments, blockEvents }) => {
      this.blockCalendarEvents = blockEvents.data.rows || [];
      this.addAppointmentsToCalendar(appointments);
    });
  }

  assignDoctor(app: any) {
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
    
    // Fetch both appointments and block calendar events
    forkJoin({
      appointments: this.appointmentService.getAppointments(firstDay, lastDay),
      blockEvents: this.appointmentService.getBlockCalendarByDateRange(this.firstDayOfMonth, this.lastDayOfMonth, this.selectedPractice?.branch_id)
    }).subscribe(({ appointments, blockEvents }) => {
      this.blockCalendarEvents = blockEvents.data.rows || [];
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
    dAppointments = dAppointments.filter(
      a => a.doctor_details && a.doctor_details.doctor_id === this.currentUser.user_id
    );
  } else if (!this.isAdmin && !this.isDoctor) {
    dAppointments = dAppointments.filter(
      a => a.patient_details.patient_id === this.currentUser.user_id
    );
  }

  if (this.selectedDoctor !== null) {
    dAppointments = dAppointments.filter(
      a => a.doctor_details && a.doctor_details.doctor_id === this.currentUser.user_id
    );
  }

  dAppointments.forEach((a: any) => {
    const doctor = this.doctorsList.find(d => d.user_id === a.doctor_details?.doctor_id);
    const colorClass = doctor ? doctor.colorClass : this.doctorColorMap[a.doctor_details?.doctor_id];
    const formattedTime = this.convertTo24Hour(a.appointment_time);

    const startDateTime = new Date(`${a.appointment_date}T${formattedTime}`);
    const endDateTime = new Date(startDateTime);
    const minutesToAdd = Number(a.duration);
    endDateTime.setMinutes(startDateTime.getMinutes() + minutesToAdd);

    events.push({
      title: this.isDoctor || this.isAdmin
        ? a.patient_details.user_profile_details[0].first_name
        : a.doctor_details?.user_profile_details[0].first_name,

      start: startDateTime,
      end: endDateTime,
      allDay: false,
      extendedProps: {
        status: 'unavailable',
        patientCode: a.patient_details.manual_unique_code,
        patientId: a.patient_details.patient_id,
        patientUniqueCode: a.patient_details.unique_code,
        patientName:
          a.patient_details.user_profile_details[0].first_name + ' ' +
          a.patient_details.user_profile_details[0].last_name,
        phone: '+91 ' + a.patient_details.phone,
        email: a.patient_details.email,
        doctor: a.doctor_details
          ? (a.doctor_details?.user_profile_details[0].first_name + ' ' +
             a.doctor_details?.user_profile_details[0].last_name)
          : null,
        duration: a.duration + ' mins',
        appointmentTime: a.appointment_time,
        bookingType: a.booking_type === 'Offline' ? 'In-Clinic' : 'Online',
        category: a.category_details?.name,
        notes: a.notes,
        appointmentId: a.id,
        availableAdvance: a.available_advance ?? 0
      },
      className: [
        `doctor-bg-${colorClass}`,
        this.currentView === 'dayGridMonth'
          ? 'month-view'
          : this.currentView === 'timeGridWeek'
          ? 'week-view'
          : 'day-view'
      ]
    });
  });

  this.addBlockCalendarEvents(events);
  this.calendarOptions.events = events;
}

  // New method to add block calendar events
  addBlockCalendarEvents(events: any[]) {
    this.blockCalendarEvents.forEach((block: any) => {
      if (block.block_type === 'allDay') {
        // All day block
        const fromDate = new Date(block.from_date);
        const toDate = new Date(block.to_date);
        
        // Create events for each day in the range
        const currentDate = new Date(fromDate);
        while (currentDate <= toDate) {
          events.push({
            title: this.getBlockTitle(block),
            start: new Date(currentDate),
            allDay: true,
            extendedProps: {
              type: 'block_calendar',
              status: 'blocked',
              blockType: 'allDay',
              leaveDetails: block.leave_details,
              doctorName: block.doctor_details?.user_profile_details?.[0] ? 
                (block.doctor_details.user_profile_details[0].first_name + ' ' + block.doctor_details.user_profile_details[0].last_name) : 'All Doctors',
              blockId: block.id,
              blockVideoAppointments: block.block_video_appointments,
              blockInClinicAppointments: block.block_in_clinic_appointments,
              createdBy: block.creator_details?.user_profile_details?.[0] ?
                (block.creator_details.user_profile_details[0].first_name + ' ' + block.creator_details.user_profile_details[0].last_name) : 'Unknown'
            },
            className: [
              'block-calendar-event',
              'block-all-day',
              block.doctor_id ? 'doctor-specific' : 'all-doctors'
            ],
            color: block.doctor_id ? '#ff9800' : '#f44336', // Orange for specific doctor, red for all doctors
            textColor: 'white'
          });
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else if (block.block_type === 'blockSlot') {
        // Time slot block
        const blockDate = new Date(block.date);
        const startTime = this.parseTimeToDate(block.start_time, blockDate);
        const endTime = this.parseTimeToDate(block.end_time, blockDate);

        events.push({
          title: this.getBlockTitle(block),
          start: startTime,
          end: endTime,
          allDay: false,
          extendedProps: {
            type: 'block_calendar',
            status: 'blocked',
            blockType: 'blockSlot',
            leaveDetails: block.leave_details,
            doctorName: block.doctor_details?.user_profile_details?.[0] ? 
              (block.doctor_details.user_profile_details[0].first_name + ' ' + block.doctor_details.user_profile_details[0].last_name) : 'All Doctors',
            blockId: block.id,
            blockVideoAppointments: block.block_video_appointments,
            blockInClinicAppointments: block.block_in_clinic_appointments,
            createdBy: block.creator_details?.user_profile_details?.[0] ?
              (block.creator_details.user_profile_details[0].first_name + ' ' + block.creator_details.user_profile_details[0].last_name) : 'Unknown',
            startTime: block.start_time,
            endTime: block.end_time
          },
          className: [
            'block-calendar-event',
            'block-slot',
            block.doctor_id ? 'doctor-specific' : 'all-doctors'
          ],
          color: block.doctor_id ? '#ff9800' : '#f44336',
          textColor: 'white'
        });
      }
    });
  }

  // Helper method to get block title
  getBlockTitle(block: any): string {
    const doctorName = block.doctor_details?.user_profile_details?.[0] ? 
      'Dr. ' + block.doctor_details.user_profile_details[0].first_name : 'All Doctors';
    
    if (block.block_type === 'allDay') {
      return `🚫 ${doctorName} - ${block.leave_details}`;
    } else {
      return `🚫 ${doctorName} - Blocked (${block.start_time}-${block.end_time})`;
    }
  }

  // Helper method to parse time string to Date object
  parseTimeToDate(timeString: string, baseDate: Date): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const result = new Date(baseDate);
    result.setHours(hours, minutes, 0, 0);
    return result;
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
  
    componentRef.instance.deleteBlock.subscribe((evt) => this.handleBlockDelete(evt));
  }

  private closePopover() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
  
  private handleBlockDelete(event: any) {
    console.log('Delete block calendar:', event);

    // Show confirmation dialog
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this block calendar entry?',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        // User confirmed deletion
        this.performBlockDelete(event);
      },
      reject: () => {
        // User cancelled deletion
        console.log('Block calendar deletion cancelled');
        this.showMessage('info', 'Cancelled', 'Block calendar deletion was cancelled');
      }
    });
  }

  private performBlockDelete(event: any) {
    const blockId = event.extendedProps.blockId;
    
    if (!blockId) {
      this.showMessage('error', 'Error', 'Block ID not found');
      return;
    }

    // Show loading message
    this.showMessage('info', 'Deleting...', 'Please wait while we delete the block calendar entry');

    // Call your appointment service to delete the block calendar
    this.appointmentService.deleteBlockCalendar(blockId.toString()).subscribe({
      next: (response) => {
        this.showMessage('success', 'Success', 'Block calendar deleted successfully');
        this.closePopover(); // Close the popover
        // Refresh the calendar
        this.updateCurrentViewData();
      },
      error: (error) => {
        console.error('Error deleting block calendar:', error);
        
        // Handle different types of errors
        if (error.status === 0) {
          this.showMessage('error', 'Connection Error', 
            'Unable to connect to server. Please check if the server is running.');
        } else if (error.status === 404) {
          this.showMessage('error', 'Not Found', 'Block calendar entry not found.');
        } else if (error.status === 401) {
          this.showMessage('error', 'Unauthorized', 'You are not authorized to delete this block calendar.');
        } else if (error.status === 403) {
          this.showMessage('error', 'Forbidden', 'You do not have permission to delete this block calendar.');
        } else {
          this.showMessage('error', 'Error', `Failed to delete block calendar: ${error.message || 'Unknown error'}`);
        }
      }
    });
  }

  private updateCurrentViewData() {
    if (this.currentView === 'dayGridMonth') {
      this.updateMonthRange();
    } else if (this.currentView === 'timeGridWeek') {
      this.updateWeekRange();
    } else if (this.currentView === 'timeGridDay') {
      this.changeDailyViewDate(0);
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
    const currentDate = new Date(this.weeklyViewDate);
    const day = currentDate.getDay();

    const firstDay = new Date(currentDate);
    firstDay.setDate(currentDate.getDate() - day);

    const lastDay = new Date(currentDate);
    lastDay.setDate(currentDate.getDate() + (6 - day));

    const firstDayFormatted = this.formatDateToYYYYMMDD(firstDay);
    const lastDayFormatted = this.formatDateToYYYYMMDD(lastDay);

    // Fetch both appointments and block calendar events
    forkJoin({
      appointments: this.appointmentService.getAppointments(firstDayFormatted, lastDayFormatted),
      blockEvents: this.appointmentService.getBlockCalendarByDateRange(firstDayFormatted, lastDayFormatted, this.selectedPractice?.branch_id)
    }).subscribe(({ appointments, blockEvents }) => {
      this.blockCalendarEvents = blockEvents.data.rows || [];
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