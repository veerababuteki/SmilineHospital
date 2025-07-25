import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreatmentPlansService } from '../../../services/treatment-plans.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { MenuItem } from 'primeng/api';
import { MessageService } from '../../../services/message.service';
import { PatientDataService } from '../../../services/patient-data.service';

@Component({
  selector: 'app-completed-procedures',
  templateUrl: './completed-procedures.component.html',
  styleUrls: ['./completed-procedures.component.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule, MenuModule, ButtonModule
  ]
})

export class CompletedProceduresComponent implements OnInit {
getFullTeethNumbers(arg0: any): string|import("@angular/core").TemplateRef<HTMLElement>|undefined {
throw new Error('Method not implemented.');
}
getShortTeethNumbers(arg0: any) {
throw new Error('Method not implemented.');
}
hasMoreTeeth(arg0: any): any {
throw new Error('Method not implemented.');
}
    currentTreatmentIndex: number | null = null;
    cost: number = 0;
    name: string = '';
    add: boolean = false;
    uniqueCode: string | null | undefined;
    doctors: any[] = [];
    doctor: any;
    date: Date = new Date()
    treatmentPlans: Record<string, any[]> = {};
    generateInvoiceList: any[] = [];
    treatmentPlanList: any[] = [];
    patientId: string | null | undefined;
    formattedData:any[] = [];
    items: MenuItem[] = [];
    currentProcedure: any;
  currentTreatmentPlan: any;
  savedPractice: any;

    constructor(private treatmentPlanService: TreatmentPlansService, private patientDataService: PatientDataService,
      private route: ActivatedRoute, private router: Router){
        const selectedPractice = localStorage.getItem('selectedPractice');
        if(selectedPractice){
          this.savedPractice = JSON.parse(selectedPractice);
        }
    }
    ngOnInit() {
      this.patientDataService.data$.subscribe((data) => {
    const treatments = data?.completedProcedures?.data?.rows || [];

    this.treatmentPlans = this.groupByDate(treatments);
      this.formattedData = this.getFormattedData();
  });
      this.items = [
        {
          label: 'Invoice Procedure',
          icon: 'pi pi-money-bill',
          command: (event) => this.generateInvoiceForProcedure(event)
        },
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          command: (event) => this.updateTreatmentPlans(event)
        }
      ];
      const routeId = this.route.parent?.snapshot.paramMap.get('id');
  const source = this.route.snapshot.paramMap.get('source');

  if (routeId && source) {
    this.patientId = routeId;
    this.uniqueCode = source;
  } else {
    const cached = localStorage.getItem('patientContext');
    if (cached) {
      const context = JSON.parse(cached);
      this.patientId = context.patientId;
      this.uniqueCode = context.uniqueCode;
    }
  } 
    }

    updateTreatmentPlans(treatmentPlan: any): void {
      this.router.navigate(['patients', this.patientId, 'add-completed-procedures', this.uniqueCode], {
        state: { mode: 'edit', procedureData: treatmentPlan }
      });
    }

    generateInvoiceForProcedure(event: any){
      this.generateInvoiceList = [];
      const id = event.id;
      const treatment_unique_id = event.treatment_unique_id;
      this.generateInvoiceList.push({ id, treatment_unique_id })
      this.router.navigate(['patients', this.patientId, 'add-invoice', this.uniqueCode], 
        {
          state: {
            procedures: this.generateInvoiceList.map(event => ({
              procedureId: event.id,
              treatmentKey: event.treatment_unique_id
          }))
          }}
      );
    }

    setCurrentProcedure(event: any): void {
      // Update menu items with the current invoice key as data
      this.currentProcedure = event
      this.items = [
        {
          label: 'Invoice Procedure',
          icon: 'pi pi-money-bill',
          command: () => this.generateInvoiceForProcedure(this.currentProcedure)
        },
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          command: () => this.updateTreatmentPlans(this.currentProcedure)
        }
      ];
    }

  loadPatientData(patientId: string) {
    this.treatmentPlanService.getCompletedTreatmentPlans(Number(patientId)).subscribe(res => {
      this.treatmentPlans = this.groupByDate(res.data.rows);
      this.formattedData = this.getFormattedData();
    });
  }
  navigateToAddPage(){
    this.router.navigate(['patients', this.patientId, 'add-completed-procedures', this.uniqueCode]);
  }

    onCheckboxChange(treatment: any, id: number, treatment_unique_id: string){
      if(treatment.isChecked){
        this.generateInvoiceList.push({id, treatment_unique_id})
      } else{
        this.generateInvoiceList = this.generateInvoiceList.filter(item => 
          item.id !== id && item.treatment_unique_id !== treatment_unique_id
        );
      }
    }

    groupByDate(rows: any[]) {
      return rows.reduce((acc, row) => {
        if(row.date == null || row.date == undefined){
          return;

        }
        const newDate = new Date(row.date)
        const options = { timeZone: 'Asia/Kolkata' };
        const istDateStr = newDate.toLocaleDateString('en-CA', options); // en-CA gives YYYY-MM-DD format
    
        // Use IST date as the key
        const dateKey = istDateStr;
        const treatmentKey = row.treatment_unique_id;
        if (dateKey !== undefined && !acc[dateKey]) {
          acc[dateKey] = [];
        }
    
        // if (row.status === 'Completed') {
        //   row.isChecked = true;
        // }
    
        acc[dateKey].push(row);
        return acc;
      }, {} as Record<string, any[]>);
    }



    getSortedTreatmentIds(rows: any) {
      // Step 1: Sort rows by date in descending order
      rows.sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
      // Step 2: Extract unique treatment IDs while maintaining order
      const uniqueIds = new Set<string>();
      return rows.map((row: any) => row.treatment_unique_id).filter((id: any) => uniqueIds.has(id) ? false : uniqueIds.add(id));
    }
  
    filterRowsByTreatment(
      rows: any, 
      treatmentKey: any
    ) {
      return rows.filter((row:any) => row.treatment_unique_id === treatmentKey);
    }

    groupByDoctor(rows: any[], treatmentKey: any):any[] {
      const filteredRows = this.filterRowsByTreatment(rows, treatmentKey);
  
      const grouped = filteredRows.reduce((acc: Record<string, any[]>, row: any) => {
          if (!row.doctor_details_treat) return acc; // Skip if doctor details are missing
  
          const doctorId = row.doctor_details_treat.doctor_id;
          if (!acc[doctorId]) {
              acc[doctorId] = [];
          }
  
          acc[doctorId].push(row);
          return acc;
      }, {});
  
      // Convert the object into an array format for *ngFor
      return Object.entries(grouped).map(([doctorId, appointments]) => ({
          doctorId,
          appointments,
      }));
  }
  

    generateInvoice(){
      // this.treatmentPlanService.generateInvoice(this.generateInvoiceList).subscribe(res => {
      //   if(this.patientId !== null && this.patientId !== undefined){
      //     this.loadPatientData(this.patientId)
      //   }
      // })
      this.router.navigate(['patients', this.patientId, 'add-invoice', this.uniqueCode], 
        {
          state: {
            procedures: this.generateInvoiceList.map(event => ({
              procedureId: event.id,
              treatmentKey: event.treatment_unique_id
            }))
          }}
      );
    }

    getTotalCost(treatmentGroup: any[]): number {
      return treatmentGroup.reduce((acc, treatment) => acc + Number(treatment.total_cost || 0), 0);
    }

    getFormattedData() {
      var dates = this.getSortedDates();
      var treatmentPlans:any[] = [];
    
      dates.forEach(date => {
        var treatmentsArray:any[] = [];
        var treatmentKeys = this.getSortedTreatmentIds(this.treatmentPlans[date]);
    
        treatmentKeys.forEach((treatmentKey: any) => {
          var doctorTreatmentsArray:any[] = [];
          var treatmentDoctorGroups = this.groupByDoctor(this.treatmentPlans[date], treatmentKey);
    
          treatmentDoctorGroups.forEach((doctorTreatment:any) => {
            doctorTreatmentsArray.push({
              doctorId: doctorTreatment.doctorId,
              treatments: doctorTreatment.appointments
            });
          });
    
          treatmentsArray.push({
            treatmentKey: treatmentKey,
            doctorTreatments: doctorTreatmentsArray
          });
        });
    
        treatmentPlans.push({
          date: date,
          treatments: treatmentsArray
        });
      });
    
      return treatmentPlans;
    }
    

    getSortedDates(): string[] {
      // Filter out null or undefined keys first, then sort
      return Object.keys(this.treatmentPlans)
        .filter(dateKey => dateKey !== null && dateKey !== undefined && dateKey !== 'null' && dateKey !== 'undefined')
        .sort((a, b) => {
          // Create dates for valid dates only
          const dateA = new Date(a);
          const dateB = new Date(b);
          
          // Ensure the dates are valid before comparing
          const isValidDateA = !isNaN(dateA.getTime());
          const isValidDateB = !isNaN(dateB.getTime());
          
          // If both dates are valid, compare them (newest first)
          if (isValidDateA && isValidDateB) {
            return dateB.getTime() - dateA.getTime();
          }
          
          // If only one date is valid, prioritize the valid one
          if (isValidDateA) return -1;
          if (isValidDateB) return 1;
          
          // If both are invalid, maintain original order
          return 0;
        });
    }

    getData():any[]{
      return [];
    }
    
    printCompletedProcedures() {
      // Save the current body content
      const originalContent = document.body.innerHTML;
      
      // Get only the completed procedures container
      const completedProceduresElement = document.getElementById('completed-procedures-container');
      
      if (!completedProceduresElement) {
        console.error('Completed procedures container not found');
        return;
      }
      
      // Get patient information from the first treatment plan
      let patientName = 'Patient Name';
      let patientId = 'Patient ID';
      
      // Find first available treatment plan with patient data
      const dates = this.getSortedDates();
      if (dates.length > 0) {
        const firstDate = dates[0];
        const plans = this.treatmentPlans[firstDate];
        if (plans && plans.length > 0) {
          const firstPlan = plans[0];
          if (firstPlan.patient_details_treat) {
            const patientDetails = firstPlan.patient_details_treat;
            
            // Get patient name
            if (patientDetails.user_profile_details && patientDetails.user_profile_details.length > 0) {
              const profile = patientDetails.user_profile_details[0];
              patientName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            }
            
            // Get patient ID/code
            patientId = patientDetails.unique_code || patientId;
          }
        }
      }
      let clinicAddress = '';
  let clinicPhone = '';
  
  if (this.savedPractice) {
    // Default address in case no branch matches
    clinicAddress = "#8-3-952/10/2&2/1, Smiline House, Srinagar Colony, Panjagutta, Hyderabad-500073";
    clinicPhone = "Phone: 040 4200 0024";
    
    switch (this.savedPractice.branch_id) {
      case 1:
        clinicAddress = "#8-3-952/10/2&2/1, Smiline House, Srinagar Colony, Panjagutta, Hyderabad-500073";
        clinicPhone = "Phone: 040 4200 0024";
        break;
      case 2:
        clinicAddress = "Matha Bhuvaneswari society, Matha Bhuvaneswari Society, Plot No. 4, opp. Computer Generated Solutions India Private Limited, Siddhi Vinayak Nagar, Madhapur, Khanammet, Hyderabad, Telangana 500081";
        clinicPhone = "Phone: 040 29804422";
        break;
      case 3:
        clinicAddress = "6th Floor, Pavani Encore Survey, 342/P, Narsing Nanakramguda Service Rd, Khajaguda, Hyderabad, Telangana 500075";
        clinicPhone = "Phone: 08889998353";
        break;
    }
  }
      // Create a styled version for printing
      const printContent = `
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          .print-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .print-header h1 {
            margin: 0;
            font-size: 24px;
          }
          .print-header p {
            margin: 5px 0;
            font-size: 14px;
          }
          .patient-info {
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
          }
          .treatment-date {
            font-weight: bold;
            margin: 15px 0 10px;
            font-size: 16px;
            background: #f5f5f5;
            padding: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f5f5f5;
          }
          .estimated-amount {
            text-align: right;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #777;
          }
          /* Hide print buttons and checkboxes */
          .actions-col, .hide-on-print, 
          {
            display: none !important;
          }
        </style>
        <body>
        <div class="print-header">
          <h1>Smiline Dental Hospitals</h1>
          <p>${clinicAddress}</p>
          <p>${clinicPhone}</p>
        </div>
        <div class="patient-info">
          <p><strong>Patient:</strong> ${patientName}</p>
          <p><strong>ID:</strong> ${patientId}</p>
          <p><strong>Generated Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <h2>COMPLETED PROCEDURES</h2>
        ${completedProceduresElement.innerHTML}
        <div class="footer">
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Powered by iDental</p>
        </div>
        <script>
        window.onload = function() {
          window.print();
        }
      </script>
        </body>
      `;
      
      // Replace the body content with our print content
      document.body.innerHTML = printContent;
      
      // Trigger the print dialog
      window.print();
      
      // Restore the original content after printing
      setTimeout(() => {
        document.body.innerHTML = originalContent;
        // Need to reinitialize component to restore functionality
        this.ngOnInit();
      }, 500);
    }
    
    // Add a keyboard listener for Ctrl+P
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
      // Check if Ctrl+P was pressed
      if (event.ctrlKey && event.key === 'p') {
        // Prevent default browser print
        event.preventDefault();
        
        // Make sure we have data before trying to print
        if (Object.keys(this.treatmentPlans).length > 0) {
          this.printCompletedProcedures();
        }
      }
    }
    
}