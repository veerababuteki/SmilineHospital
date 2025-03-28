import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Checkbox, CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-appointments-print',
  imports: [CommonModule, TableModule, CheckboxModule, DropdownModule, FormsModule],
  templateUrl: './appointments-print.component.html',
  styleUrl: './appointments-print.component.scss'
})
export class AppointmentsPrintComponent {
  @Input() appointments: any;
  selectedDate = "Today";
  selectedDoctor = "All doctors";
  selectedFontSize = "Medium";

  showContactNumber: boolean = true;
  showNotes = true;
  showAppointmentCategories = true;
  showTreatmentPlans = false;
  showFreeSlots = false;
  groupByDoctors = true;

  dateOptions = ["Today", "Tomorrow", "This Week"];
  doctorOptions = ["All doctors", "Dr. Sunitha"];
  fontSizeOptions = ["Small", "Medium", "Large"];


  get groupedAppointments() {
    if (!this.groupByDoctors) {
      return [{ name: "All Appointments", appointments: this.appointments }];
    }
    const groups: any = {};
    this.appointments.forEach((appt: any) => {
      const doctorName = appt.doctor_details?.user_profile_details[0]?.first_name || "Unknown Doctor";
      if (!groups[doctorName]) {
        groups[doctorName] = [];
      }
      groups[doctorName].push(appt);
    });
    return Object.keys(groups).map(doctor => ({ name: doctor, appointments: groups[doctor] }));
  }

  printAppointments() {
    let printContent = document.getElementById("appointments-container")?.innerHTML;
    let newWindow = window.open("", "_blank", "width=1200,height=900");

    if (newWindow) {
      newWindow.document.write(`
            <html>
            <head>
                <title>Print Appointments</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid black; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <h2>Appointments Schedule</h2>
                ${printContent}
                <script>
                    window.onload = function() { 
                        window.print(); 
                        window.close(); 
                    };
                </script>
            </body>
            </html>
        `);
      newWindow.document.close();
    }
  }
}
