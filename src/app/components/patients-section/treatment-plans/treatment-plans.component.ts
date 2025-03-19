import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Procedure, TreatmentForm } from './treatment.interface';
import { TreatmentPlansService } from '../../../services/treatment-plans.service';
import { UserService } from '../../../services/user.service';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-treatment-plans',
  templateUrl: './treatment-plans.component.html',
  styleUrls: ['./treatment-plans.component.scss'],
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, FormsModule, DropdownModule, CalendarModule  ]
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

  constructor(private fb: FormBuilder, 
    private treatmentPlansService: TreatmentPlansService,
    private router: Router,
    private route: ActivatedRoute
  ) {
  }
  
  groupedData: { [key: string]: any[] } = {};

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      if(this.patientId == null) {
        this.patientId = params.get('id');
      }
      if (this.patientId) {
        this.loadPatientData(this.patientId);
      }
    });
  }
  loadPatientData(patientId: string){
    if(this.patientId !== null && this.patientId !== undefined){
      this.treatmentPlansService.getTreatmentPlans(Number(this.patientId)).subscribe(res => {
        this.treatmentPlans = this.groupByDate(res.data.rows);
      });
    }
  }
  onCheckboxChange(treatment: any, treatmentId: number, treatment_unique_id: string){
    if(treatment.isChecked){
      this.markCompleteList.push({id: treatmentId, treatment_unique_id: treatment_unique_id})
      this.generateInvoiceList.push({id: treatmentId, treatment_unique_id: treatment_unique_id})
    } else{
      this.markCompleteList = this.markCompleteList.filter(item => 
        item.id !== treatmentId || item.treatment_unique_id !== treatment_unique_id
      );
      this.generateInvoiceList = this.generateInvoiceList.filter(item => 
        item.id !== treatmentId || item.treatment_unique_id !== treatment_unique_id
      );
    }
  }
  // groupByDate(rows: any[]) {
  //   return rows.reduce((acc, row) => {
  //     const dateKey = row.date;
  //     if (!acc[dateKey]) {
  //       acc[dateKey] = [];
  //     }
  //     if(row.status == 'Completed'){
  //       row.isChecked = true
  //     }
  //     acc[dateKey].push(row);
  //     return acc;
  //   }, {} as Record<string, any[]>);
  // }
  groupByDate(rows: any[]) {
    rows.sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const groupedByDate = rows.reduce((acc, row) => {
      const dateKey = row.date.split('T')[0]; // Extract date part
  
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
  

  markAsComplete(){
    if(this.markCompleteList.length == 0) return;
    this.treatmentPlansService.markAsComplete(this.markCompleteList).subscribe(res=>{
        if(this.patientId !== null && this.patientId !== undefined){
          this.loadPatientData(this.patientId);
        }
    })
  }

  // onInvoiceCheckboxChange(treatment: any, id: number, treatment_unique_id: string){
  //   if(treatment.isChecked){
  //     this.generateInvoiceList.push({id, treatment_unique_id})
  //   } else{
  //     this.generateInvoiceList = this.generateInvoiceList.filter(item => 
  //       item.id !== id && item.treatment_unique_id !== treatment_unique_id
  //     );
  //   }
  // }

  generateInvoice(){
    this.treatmentPlansService.generateInvoice(this.generateInvoiceList).subscribe(res => {
      if(this.patientId !== null && this.patientId !== undefined){
        this.loadPatientData(this.patientId)
      }
    })
  }

  navigateToAddPage(){
    this.router.navigate(['patients', this.patientId, 'add-treatment-plan']);
  }

  getSortedDates(): string[] {
    return Object.keys(this.treatmentPlans).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }
}