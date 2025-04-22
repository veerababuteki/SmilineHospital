import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Procedure, TreatmentForm } from './treatment.interface';
import { TreatmentPlansService } from '../../../services/treatment-plans.service';
import { UserService } from '../../../services/user.service';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem, MenuItemCommandEvent } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { TreatmentPlansPrintComponent } from './treatment-plans-print/treatment-plans-print.component';

@Component({
  selector: 'app-treatment-plans',
  templateUrl: './treatment-plans.component.html',
  styleUrls: ['./treatment-plans.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DropdownModule, CalendarModule, MenuModule, ButtonModule, TreatmentPlansPrintComponent]
})
export class TreatmentPlansComponent implements OnInit {
  treatmentForm!: FormGroup;
  currentTreatmentIndex: number | null = null;
  cost: number = 0;
  name: string = '';
  procedures: Procedure[] = [];
  add: boolean = false;
  doctors: any[] = [];
  doctor: any;
  date: Date = new Date()
  treatmentPlans: Record<string, any[]> = {};
  markCompleteList: { id: number, treatment_unique_id: string }[] = []
  patientId: string | null | undefined;
  generateInvoiceList: any[] = [];
  currentTreatmentPlan: any;

  constructor(private fb: FormBuilder,
    private treatmentPlansService: TreatmentPlansService,
    private router: Router,
    private route: ActivatedRoute
  ) {
  }

  groupedData: { [key: string]: any[] } = {};
  items: MenuItem[] = [];

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      if (this.patientId == null) {
        this.patientId = params.get('id');
      }
      if (this.patientId) {
        this.loadPatientData(this.patientId);
      }
    });

    this.items = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: (event) => this.updateTreatmentPlans(event)
      }
    ];
  }

  updateTreatmentPlans(treatmentPlan: any): void {
    this.router.navigate(['patients', this.patientId, 'add-treatment-plan'], {
      state: { mode: 'edit', treatmentData: treatmentPlan }
    });
  }

  setCurrentTreatmentPlan(rows: any,
  treatmentKey: any): void {
    // Update menu items with the current invoice key as data
    this.currentTreatmentPlan = rows.filter((row: any) => row.treatment_unique_id === treatmentKey)
    this.items = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.updateTreatmentPlans(this.currentTreatmentPlan)
      }
    ];
  }

  loadPatientData(patientId: string) {
    if (this.patientId !== null && this.patientId !== undefined) {
      this.treatmentPlansService.getTreatmentPlans(Number(this.patientId)).subscribe(res => {
        var activeTreatmentPlans = res.data.rows.filter((_:any) => _.status != "Completed");
        this.treatmentPlans = this.groupByDate(activeTreatmentPlans);
      });
    }
  }
  onCheckboxChange(treatment: any, treatmentId: number, treatment_unique_id: string) {
    if (treatment.isChecked) {
      this.markCompleteList.push({ id: treatmentId, treatment_unique_id: treatment_unique_id })
      this.generateInvoiceList.push({ id: treatmentId, treatment_unique_id: treatment_unique_id })
    } else {
      this.markCompleteList = this.markCompleteList.filter(item =>
        item.id !== treatmentId || item.treatment_unique_id !== treatment_unique_id
      );
      this.generateInvoiceList = this.generateInvoiceList.filter(item =>
        item.id !== treatmentId || item.treatment_unique_id !== treatment_unique_id
      );
    }
  }
  
  groupByDate(rows: any[]) {
    rows.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const groupedByDate = rows.reduce((acc, row) => {
      const newDate = new Date(row.date)
        const options = { timeZone: 'Asia/Kolkata' };
        const istDateStr = newDate.toLocaleDateString('en-CA', options); // en-CA gives YYYY-MM-DD format
    
        // Use IST date as the key
        const dateKey = istDateStr;

      const treatmentKey = row.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }

      if (row.status === 'Completed') {
        row.isChecked = true;
      }

      acc[dateKey].push(row);
      return acc;
    }, {} as Record<string, Record<string, any[]>>);

    return groupedByDate;
  }

  getSortedTreatmentIds(rows: any) {
    // Step 1: Sort rows by date in descending order
    rows.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Step 2: Extract unique treatment IDs while maintaining order
    const uniqueIds = new Set<string>();
    return rows.map((row: any) => row.treatment_unique_id).filter((id: any) => uniqueIds.has(id) ? false : uniqueIds.add(id));
  }

  filterRowsByTreatment(
    rows: any,
    treatmentKey: any
  ) {
    return rows.filter((row: any) => row.treatment_unique_id === treatmentKey);
  }


  markAsComplete() {
    if (this.markCompleteList.length == 0) return;
    this.treatmentPlansService.markAsComplete(this.markCompleteList).subscribe(res => {
      if (this.patientId !== null && this.patientId !== undefined) {
        this.loadPatientData(this.patientId);
      }
    })
  }

  generateInvoice() {
    this.treatmentPlansService.generateInvoice(this.generateInvoiceList).subscribe(res => {
      if (this.patientId !== null && this.patientId !== undefined) {
        this.loadPatientData(this.patientId)
      }
    })
  }

  navigateToAddPage() {
    this.router.navigate(['patients', this.patientId, 'add-treatment-plan']);
  }

  getSortedDates(): string[] {
    return Object.keys(this.treatmentPlans).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }

  getTotalCost(treatmentGroup: any[]): number {
    return treatmentGroup.reduce((acc, treatment) => acc + Number(treatment.total_cost || 0), 0);
  }

  printTreatmentPlans() {
    // Save the current body content
    const originalContent = document.body.innerHTML;
    
    // Get only the treatment plans container
    const treatmentPlansElement = document.getElementById('treatment-plans-container');
    
    if (!treatmentPlansElement) {
      console.error('Treatment plans container not found');
      return;
    }
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
          .hide-on-print {
      display: none !important;
    }
    
    table {
      width: 100%;
    }
      </style>
      <div class="print-header">
        <h1>Smiline Dental Hospitals</h1>
        <p>#8-3-952/10/2&2/1, Smiline House, Srinagar Colony, Panjagutta, Hyderabad-500073</p>
        <p>Phone: 040 4200 0024</p>
      </div>
      <div class="patient-info">
        <p><strong>Patient:</strong> ${patientName}</p>
      <p><strong>ID:</strong> ${patientId}</p>
        <p><strong>Generated Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      ${treatmentPlansElement.innerHTML}
      <div class="footer">
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Powered by iDental</p>
      </div>
    `;
    
    // Replace the body content with our print content
    document.body.innerHTML = printContent;
    
    // Trigger the print dialog
    window.print();
    
    // Restore the original content after printing
    setTimeout(() => {
      document.body.innerHTML = originalContent;
      // Reattach any event listeners that were lost
      // You might need to reinitialize certain components here
    }, 500);
  }

  @HostListener('document:keydown', ['$event'])
handleKeyboardEvent(event: KeyboardEvent) {
  // Check if Ctrl+P was pressed
  if (event.ctrlKey && event.key === 'p') {
    // Prevent default browser print
    event.preventDefault();
    if(Object.keys(this.treatmentPlans).length > 0){
      this.printTreatmentPlans();
    }
    // Call your custom print function
  }
}
}