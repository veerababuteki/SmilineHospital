import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreatmentPlansService } from '../../../services/treatment-plans.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss'],
  standalone: true,
  imports: [ CommonModule
  ]
})
export class PaymentsComponent implements OnInit {
    payments:Record<string, any[]> = {};
  patientId: string | null | undefined;

    ngOnInit(): void {
      this.route.parent?.paramMap.subscribe(params => {
        if(this.patientId == null) {
          this.patientId = params.get('id');
        }
        if (this.patientId) {
          this.loadPatientData(this.patientId);
        }
      });
      
    }
    navigateToAddPayment(){
      this.router.navigate(['/patients', this.patientId, 'add-payment'])
    }
    loadPatientData(patientId: string){
      this.treatmentPlansService.getPayments(Number(patientId)).subscribe(res=>{
        this.payments = this.groupByDate(res.data);
      })
    }
    groupByDate(rows: any[]) {
      const grouped = rows.reduce((acc, row) => {
        const dateKey = row.created_at;
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
      return Object.keys(this.payments).sort((a, b) => 
        new Date(b).getTime() - new Date(a).getTime()
      );
    }
    constructor(private treatmentPlansService: TreatmentPlansService, private route: ActivatedRoute, private router: Router){

    }
}