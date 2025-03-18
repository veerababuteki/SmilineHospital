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
        this.sortByDate(res.data.rows);
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
    const groupedByDate = rows.reduce((acc, row) => {
      const dateKey = row.date.split('T')[0]; // Extract date part
      if (!acc[dateKey]) {
        acc[dateKey] = {};
      }
  
      const treatmentKey = row.treatment_unique_id;
      if (!acc[dateKey][treatmentKey]) {
        acc[dateKey][treatmentKey] = [];
      }
  
      if (row.status === 'Completed') {
        row.isChecked = true;
      }
  
      acc[dateKey][treatmentKey].push(row);
      return acc;
    }, {} as Record<string, Record<string, any[]>>);
  
    Object.keys(groupedByDate).forEach(dateKey => {
      const treatmentGroups = groupedByDate[dateKey];
  
      // Sort each treatment group by date (Ascending)
      Object.values(treatmentGroups).forEach((records:any) => {
        records.sort((a:any, b:any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      });
  
      // Sort treatment groups by their **latest** date (Descending)
      groupedByDate[dateKey] = Object.fromEntries(
        Object.entries(treatmentGroups).sort(([, recordsA]:[string,any], [, recordsB]:[string,any]) => {
          const latestDateA = new Date(recordsA[recordsA.length - 1].date).getTime();
          const latestDateB = new Date(recordsB[recordsB.length - 1].date).getTime();
          return latestDateA - latestDateB; // Newest treatment first
        })
      );
    });
  
    return groupedByDate;
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