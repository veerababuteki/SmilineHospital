import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreatmentPlansService } from '../../../services/treatment-plans.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-completed-procedures',
  templateUrl: './completed-procedures.component.html',
  styleUrls: ['./completed-procedures.component.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule
  ]
})
export class CompletedProceduresComponent implements OnInit {
    currentTreatmentIndex: number | null = null;
    cost: number = 0;
    name: string = '';
    add: boolean = false;
    doctors: any[] = [];
    doctor: any;
    date: Date = new Date()
    treatmentPlans: Record<string, any[]> = {};
    generateInvoiceList: any[] = [];
    treatmentPlanList: any[] = [];
    patientId: string | null | undefined;

    constructor(private treatmentPlanService: TreatmentPlansService, private route: ActivatedRoute, private router: Router){

    }
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
  loadPatientData(patientId: string) {
    this.treatmentPlanService.getCompletedTreatmentPlans(Number(patientId)).subscribe(res => {
      this.treatmentPlans = this.groupByDate(res.data.rows);
    });
  }
  navigateToAddPage(){
    this.router.navigate(['patients', this.patientId, 'add-completed-procedures']);
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
        const dateKey = row.date.split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = {};
        }
    
        const treatmentKey = row.treatment_unique_id;
        if (!acc[dateKey][treatmentKey]) {
          acc[dateKey][treatmentKey] = [];
        }
    
        // if (row.status === 'Completed') {
        //   row.isChecked = true;
        // }
    
        acc[dateKey][treatmentKey].push(row);
        return acc;
      }, {} as Record<string, Record<string, any[]>>);
    }

    generateInvoice(){
      this.treatmentPlanService.generateInvoice(this.generateInvoiceList).subscribe(res => {
        if(this.patientId !== null && this.patientId !== undefined){
          this.loadPatientData(this.patientId)
        }
      })
    }

    getTotalCost(treatmentGroup: any[]): number {
      return treatmentGroup.reduce((acc, treatment) => acc + Number(treatment.total_cost || 0), 0);
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
}