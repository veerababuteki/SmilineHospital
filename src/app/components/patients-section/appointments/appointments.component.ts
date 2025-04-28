import { Component, OnInit, ViewChild ,Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentService } from '../../../services/appointment.service';
import { forkJoin } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { AppointmentComponent } from '../../appointment/appointment.component';
import { AuthService } from '../../../services/auth.service';
import { MessageService } from '../../../services/message.service';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss'],
  standalone: true,
  imports: [ CommonModule, AppointmentComponent ]
})
export class AppointmentsComponent implements OnInit {
  appointments: Record<string, any[]> = {};
  patientId: string | null | undefined;
  uniqueCode: string | null | undefined;
  doctors: any[] = [];
  categories: any[] = [];
  isDataLoaded: boolean = false;
  editAppointment: boolean = false;
  currentUser: any;
  patientAppointments: any[] = [];
  minDate: Date = new Date(); // This will set minimum date to today

  constructor(
    private route: ActivatedRoute, 
    private userService: UserService, 
    
    private authService: AuthService,
    private router: Router, 
    private appointmentService: AppointmentService,
    private messageService: MessageService,
  ) {}
  
    // Set the minDate to beginning of today (midnight)


  
  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      if(this.patientId == null) {
        this.patientId = params.get('id');
      }
    });
    // Set the minDate to beginning of today (midnight)
    this.minDate.setHours(0, 0, 0, 0);
    this.route.paramMap.subscribe(params => {
      if(this.uniqueCode == null) {
        this.uniqueCode = params.get('source');
      }
      if (this.uniqueCode) {
        this.loadPatientData(this.uniqueCode);
      }
    });
    
    forkJoin({
      doctors: this.userService.getDoctors('bce9f008-d447-4fe2-a29e-d58d579534f0'),
      categories: this.userService.getCategories(),
      currentUser: this.authService.getUser()
    }).subscribe({
      next: ({doctors, categories, currentUser}) => {
        const doctorsList = doctors.data;
        this.doctors = []; // Make sure to initialize the array
        
        doctorsList.forEach((doc: any) => {
          this.doctors.push({
            name: doc.first_name + " " + doc.last_name,
            user_id: doc.user_id,
            // Add any other properties needed for the dropdown
            // Make sure each doctor object has the required properties
            // for PrimeNG dropdown (like label and value if those are used)
            label: doc.first_name + " " + doc.last_name, // Add this for dropdown display
            value: doc.user_id // Add this for dropdown value
          });
        });
        
        // Make sure categories is an array with the correct structure for PrimeNG dropdown
        this.categories = categories.data.rows.map((category: any) => ({
          ...category,
          label: category.name, // Add this for dropdown display
          value: category.category_id // Add this for dropdown value
        }));
        
        this.currentUser = currentUser.data;
        this.isDataLoaded = true;
      },
      error: (err) => {
        console.error('Error fetching data:', err);
      }
    });
  }
  @ViewChild('myButton', { static: false }) myButton!: AppointmentComponent;
  
  handleEventEdit(appointment: any) {
    this.myButton.editAppointment = true;
    this.myButton.appointementId = appointment.id;
    this.myButton.appointment = this.patientAppointments.filter(a => a.id === appointment.id)[0];
    this.myButton.showDialog(true);
  }
  loadPatientData(patientId: string) {
    this.messageService.sendMessage(this.patientId ?? '', this.uniqueCode ?? '')
    this.appointmentService.getAppointmentsByPatientID(patientId).subscribe(res => {
      this.patientAppointments = res.data.rows;
      this.appointments = this.groupByDate(res.data.rows);
    });
  }

  groupByDate(rows: any[]) {
    const grouped = rows.reduce((acc, row) => {
      const dateKey = row.appointment_date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(row);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.fromEntries(
      Object.entries(grouped).sort(([dateA], [dateB]) => {
        const timestampA = new Date(dateA).getTime();
        const timestampB = new Date(dateB).getTime();
        return timestampB - timestampA;
      })
    ) as Record<string, any[]>;
  }
  
  getSortedDates(): string[] {
    return Object.keys(this.appointments).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  }
}