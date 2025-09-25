import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, SimpleChanges, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { AppointmentService } from '../../../services/appointment.service';
import { UserService } from '../../../services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, of, Subscription } from 'rxjs';

interface DoctorGroup {
  doctorId: string;
  doctorName: string;
  appointments: any[];
}

interface DateGroup {
  date: string;
  displayDate: string;
  appointments: any[];
}

@Component({
  selector: 'app-appointments-print',
  templateUrl: './appointments-print.component.html',
  styleUrls: ['./appointments-print.component.scss'],
  standalone: true,
  imports: [CommonModule, CheckboxModule, DropdownModule, FormsModule, ButtonModule, CalendarModule],

})
export class AppointmentsPrintComponent implements OnInit, OnDestroy {
  @Input() appointments: any[] = [];
  @Output() closeDialog = new EventEmitter<void>();
  @Input() selectedPractice: any; 
  
  // Practice management properties
  private branchesSubscription!: Subscription;
  practices: any[] = [];
  public currentPractice: string = '';

  // Form values
  selectedDate = 'Today';
  selectedDoctor = 'All doctors';
  selectedFontSize = 'Medium';
  
  // Date picker for specific date
  specificDate: Date = new Date();
  showDatePicker: boolean = false;
  
  // Date range for display
  dateRangeText: string = '';
  
  // Checkboxes
  showContactNumber: boolean = false;
  showNotes: boolean = false;
  showAppointmentCategories: boolean = false;
  showTreatmentPlans: boolean = false;
  showFreeSlots: boolean = false;
  groupByDoctors: boolean = false;
  
  // Dropdown options
  dateOptions = [
    { label: 'Today', value: 'Today' },
    { label: 'Tomorrow', value: 'Tomorrow' },
    { label: 'This Week', value: 'This Week' },
    { label: 'Next Seven Days', value: 'Next Seven Days' },
    { label: 'Specific', value: 'Specific' },
  ];
  
  doctorOptions = [
    { label: 'All doctors', value: 'All doctors' }
  ];
  
  fontSizeOptions = [
    { label: 'Small', value: 'Small' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Large', value: 'Large' }
  ];
  
  // Current date for display
  currentDate: string = '';
  
  constructor(
    private appointmentService: AppointmentService, 
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit() {
    // Set current date in format "Apr 07, 2025"
    this.currentDate = format(new Date(), 'MMM dd, yyyy');
    
    // Load practices and initialize
    this.initializePractices();
  }

  ngOnDestroy() {
    if (this.branchesSubscription) {
      this.branchesSubscription.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedPractice'] && changes['selectedPractice'].currentValue) {
      console.log('Practice changed:', changes['selectedPractice']);
      this.updateCurrentPractice();
    }
  }

  private initializePractices(): void {
    this.branchesSubscription = this.userService.getBranches()
      .pipe(
        catchError(error => {
          this.showErrorMessage('Failed to load practices. Please try again.');
          console.error('Error loading branches:', error);
          return of({ data: [] });
        })
      )
      .subscribe((res: { data: any[]; }) => {
        this.practices = res.data;
        this.loadSavedPractice();
      });
  }

  private loadSavedPractice(): void {
    try {
      const savedPractice = localStorage.getItem('selectedPractice');
      if (savedPractice) {
        this.selectedPractice = JSON.parse(savedPractice);
      } else if (this.practices && this.practices.length > 0) {
        this.selectedPractice = this.practices[0];
        localStorage.setItem('selectedPractice', JSON.stringify(this.selectedPractice));
      }
      
      // Update current practice display
      this.updateCurrentPractice();
      
      // Load initial appointments
      this.onDateOptionChange();
      
      // Add doctors from appointments to dropdown options
      this.updateDoctorOptions();

    } catch (error) {
      console.error('Error loading saved practice:', error);
      this.showErrorMessage('Error loading saved practice settings.');
    }
  }

  private updateCurrentPractice(): void {
    this.currentPractice = this.getCurrentPractice(this.selectedPractice);
    console.log('Updated currentPractice:', this.currentPractice);
    
    // Ensure UI updates
    this.cdr.detectChanges();
  }

  getCurrentPractice(selectedPractice: any): string { 
    return selectedPractice?.branch_name ?? 'No branch name found';
  }

  private showErrorMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  onDateOptionChange() {
    const today = new Date();
    let firstDate: Date;
    let lastDate: Date;
    
    switch (this.selectedDate) {
      case 'Today':
        firstDate = today;
        lastDate = today;
        this.dateRangeText = format(today, 'MMM dd, yyyy');
        break;
        
      case 'Tomorrow':
        firstDate = addDays(today, 1);
        lastDate = addDays(today, 1);
        this.dateRangeText = format(firstDate, 'MMM dd, yyyy');
        break;
        
      case 'This Week':
        firstDate = startOfWeek(today, { weekStartsOn: 0 }); // 0 = Sunday
        lastDate = endOfWeek(today, { weekStartsOn: 0 }); // 6 = Saturday
        this.dateRangeText = `${format(firstDate, 'MMM dd')} - ${format(lastDate, 'MMM dd, yyyy')}`;
        break;
        
      case 'Next Seven Days':
        firstDate = today;
        lastDate = addDays(today, 6); // Today + 6 more days = 7 days total
        this.dateRangeText = `${format(firstDate, 'MMM dd')} - ${format(lastDate, 'MMM dd, yyyy')}`;
        break;
        
      case 'Specific':
        this.showDatePicker = true;
        firstDate = this.specificDate;
        lastDate = this.specificDate;
        this.dateRangeText = format(this.specificDate, 'MMM dd, yyyy');
        break;
        
      default:
        firstDate = today;
        lastDate = today;
        this.dateRangeText = format(today, 'MMM dd, yyyy');
    }
    
    // Format dates for API call (YYYY-MM-DD)
    const formattedFirstDate = format(firstDate, 'yyyy-MM-dd');
    const formattedLastDate = format(lastDate, 'yyyy-MM-dd');
    
    // Call API to get appointments
    this.getAppointments(formattedFirstDate, formattedLastDate);
  }
  
  onSpecificDateChange() {
    if (this.specificDate) {
      const formattedDate = format(this.specificDate, 'yyyy-MM-dd');
      this.dateRangeText = format(this.specificDate, 'MMM dd, yyyy');
      this.getAppointments(formattedDate, formattedDate);
    }
  }
  
  getAppointments(firstDate: any, lastDate: any) {
    this.appointmentService.getAppointments(firstDate, lastDate).subscribe(res => {
      this.appointments = res.data.rows;
      this.processAppointments();
      this.updateDoctorOptions();
    });
  }
  
  processAppointments() {
    // Sort appointments by time
    if (this.appointments?.length) {
      this.appointments.sort((a, b) => {
        const timeA = this.convertTimeToMinutes(a.appointment_time);
        const timeB = this.convertTimeToMinutes(b.appointment_time);
        return timeA - timeB;
      });
    }
  }
  
  convertTimeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + minutes;
  }
  
  updateDoctorOptions() {
    // Reset doctor options
    this.doctorOptions = [
      { label: 'All doctors', value: 'All doctors' }
    ];
    
    // Extract unique doctors from appointments
    if (this.appointments?.length) {
      const uniqueDoctors = new Set<string>();
      
      this.appointments.forEach(appointment => {
        if (appointment.doctor_details?.user_profile_details?.[0]) {
          const firstName = appointment.doctor_details.user_profile_details[0].first_name || '';
          const lastName = appointment.doctor_details.user_profile_details[0].last_name || '';
          const fullName = `Dr. ${firstName} ${lastName}`.trim();
          
          if (fullName !== 'Dr. ') {
            uniqueDoctors.add(fullName);
          }
        }
      });
      
      // Add unique doctors to options
      uniqueDoctors.forEach(doctor => {
        this.doctorOptions.push({ label: doctor, value: doctor });
      });
    }
  }
  
  filterAppointmentsByDoctor() {
    if (this.selectedDoctor === 'All doctors') {
      return this.appointments;
    }
    
    return this.appointments.filter(appointment => {
      if (!appointment.doctor_details?.user_profile_details?.[0]) return false;
      
      const firstName = appointment.doctor_details.user_profile_details[0].first_name || '';
      const lastName = appointment.doctor_details.user_profile_details[0].last_name || '';
      const fullName = `Dr. ${firstName} ${lastName}`.trim();
      
      return fullName === this.selectedDoctor;
    });
  }
  
  getGroupedAppointments(): DoctorGroup[] {
    const filteredAppointments = this.filterAppointmentsByDoctor();
    if (!filteredAppointments?.length) return [];
    
    const doctorGroups: { [key: string]: DoctorGroup } = {};
    
    filteredAppointments.forEach(appointment => {
      if (appointment.doctor_details?.user_profile_details?.[0]) {
        const firstName = appointment.doctor_details.user_profile_details[0].first_name || '';
        const lastName = appointment.doctor_details.user_profile_details[0].last_name || '';
        const doctorName = `Dr. ${firstName} ${lastName}`.trim();
        const doctorId = appointment.doctor_details.doctor_id || 
                         appointment.doctor_details.user_id || 
                         `doctor-${firstName}-${lastName}`;
        
        if (!doctorGroups[doctorId]) {
          doctorGroups[doctorId] = {
            doctorId,
            doctorName,
            appointments: []
          };
        }
        
        doctorGroups[doctorId].appointments.push(appointment);
      } else {
        // For appointments without doctor info
        const unknownDoctorId = 'unknown-doctor';
        if (!doctorGroups[unknownDoctorId]) {
          doctorGroups[unknownDoctorId] = {
            doctorId: unknownDoctorId,
            doctorName: 'Unknown Doctor',
            appointments: []
          };
        }
        
        doctorGroups[unknownDoctorId].appointments.push(appointment);
      }
    });
    
    // Sort each doctor's appointments by time
    Object.values(doctorGroups).forEach(group => {
      group.appointments.sort((a, b) => {
        const timeA = this.convertTimeToMinutes(a.appointment_time);
        const timeB = this.convertTimeToMinutes(b.appointment_time);
        return timeA - timeB;
      });
    });
    
    // Convert to array and return
    return Object.values(doctorGroups);
  }
  
  printAppointments() {
    const printContent = document.getElementById('appointments-container')?.innerHTML;
    const newWindow = window.open('', '_blank', 'width=1200,height=900');
    
    if (newWindow && printContent) {
      newWindow.document.write(`
        <html>
        <head>
          <title>Print Schedule</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              font-size: ${this.getFontSize()};
            }
            
            h3 {
              font-size: 18px;
              margin-bottom: 5px;
            }
            
            h4.doctor-name {
              color: #037ad7;
              margin-top: 20px;
              margin-bottom: 10px;
              padding-bottom: 5px;
              border-bottom: 1px solid #ccc;
            }
            
            .date {
              font-size: 14px;
              color: #555;
              margin-top: 0;
              margin-bottom: 15px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            
            td {
              padding: 12px 8px;
              border-bottom: 1px solid #e0e0e0;
            }
            
            .time-column {
              width: 180px;
              color: #555;
            }
            
            .doctor-column {
              width: 200px;
              color: #037ad7;
            }
            
            .patient-column {
              color: #555;
            }
            
            .patient-column span {
              color: #777;
            }
            
            .doctor-group {
              margin-bottom: 30px;
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            };
          </script>
        </body>
        </html>
      `);
      
      newWindow.document.close();
    }
  }
  
  getFontSize(): string {
    switch (this.selectedFontSize) {
      case 'Small': return '12px';
      case 'Medium': return '14px';
      case 'Large': return '16px';
      default: return '14px';
    }
  }

  cancelPrint() {
    // If this component is opened in a dialog or modal
    // You can emit an event to close it from the parent
    const closeEvent = new CustomEvent('close-print-dialog', {
      bubbles: true,
      composed: true
    });
    document.dispatchEvent(closeEvent);
    
    // If you're using a service with an observable to control the dialog
    // You can use that service here to close it, for example:
    // this.dialogService.close();
    
    // If there's no dialog framework, you can go back to the previous page
    // or simply reset the form to defaults
    this.selectedDate = 'Today';
    this.selectedDoctor = 'All doctors';
    this.selectedFontSize = 'Medium';
    this.showContactNumber = false;
    this.showNotes = false;
    this.showAppointmentCategories = false;
    this.showTreatmentPlans = false;
    this.showFreeSlots = false;
    this.groupByDoctors = false;
    
    // Reload today's appointments
    this.onDateOptionChange();
    this.closeDialog.emit();
  }

  getFontSizeClass(): string {
    switch (this.selectedFontSize) {
      case 'Small': return 'font-size-small';
      case 'Medium': return 'font-size-medium';
      case 'Large': return 'font-size-large';
      default: return 'font-size-medium';
    }
  }

  getGroupedAppointmentsForDate(appointments: any[]): DoctorGroup[] {
    if (!appointments?.length) return [];
    
    const doctorGroups: { [key: string]: DoctorGroup } = {};
    
    appointments.forEach(appointment => {
      if (appointment.doctor_details?.user_profile_details?.[0]) {
        const firstName = appointment.doctor_details.user_profile_details[0].first_name || '';
        const lastName = appointment.doctor_details.user_profile_details[0].last_name || '';
        const doctorName = `Dr. ${firstName} ${lastName}`.trim();
        const doctorId = appointment.doctor_details.doctor_id || 
                         appointment.doctor_details.user_id || 
                         `doctor-${firstName}-${lastName}`;
        
        if (!doctorGroups[doctorId]) {
          doctorGroups[doctorId] = {
            doctorId,
            doctorName,
            appointments: []
          };
        }
        
        doctorGroups[doctorId].appointments.push(appointment);
      } else {
        // For appointments without doctor info
        const unknownDoctorId = 'unknown-doctor';
        if (!doctorGroups[unknownDoctorId]) {
          doctorGroups[unknownDoctorId] = {
            doctorId: unknownDoctorId,
            doctorName: 'Unknown Doctor',
            appointments: []
          };
        }
        
        doctorGroups[unknownDoctorId].appointments.push(appointment);
      }
    });
    
    // Sort each doctor's appointments by time
    Object.values(doctorGroups).forEach(group => {
      group.appointments.sort((a, b) => {
        const timeA = this.convertTimeToMinutes(a.appointment_time);
        const timeB = this.convertTimeToMinutes(b.appointment_time);
        return timeA - timeB;
      });
    });
    
    // Convert to array and return
    return Object.values(doctorGroups);
  }

  // Add this method to group appointments by date
  getDateGroupedAppointments(): DateGroup[] {
    const filteredAppointments = this.filterAppointmentsByDoctor();
    if (!filteredAppointments?.length) return [];
    
    const dateGroups: { [key: string]: DateGroup } = {};
    
    filteredAppointments.forEach(appointment => {
      if (appointment.appointment_date) {
        const dateKey = appointment.appointment_date;
        const displayDate = this.formatDisplayDate(dateKey);
        
        if (!dateGroups[dateKey]) {
          dateGroups[dateKey] = {
            date: dateKey,
            displayDate: displayDate,
            appointments: []
          };
        }
        
        dateGroups[dateKey].appointments.push(appointment);
      }
    });
    
    // Sort each date's appointments by time
    Object.values(dateGroups).forEach(group => {
      group.appointments.sort((a, b) => {
        const timeA = this.convertTimeToMinutes(a.appointment_time);
        const timeB = this.convertTimeToMinutes(b.appointment_time);
        return timeA - timeB;
      });
    });
    
    // Convert to array and sort by date
    return Object.values(dateGroups).sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }

  // Helper method to format the date for display
  formatDisplayDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE, MMM dd, yyyy'); // e.g., "Monday, Apr 07, 2025"
    } catch (e) {
      return dateString;
    }
  }

  // Add a helper method to check if we should use date grouping
  shouldGroupByDate(): boolean {
    return this.selectedDate === 'This Week' || this.selectedDate === 'Next Seven Days';
  }
}