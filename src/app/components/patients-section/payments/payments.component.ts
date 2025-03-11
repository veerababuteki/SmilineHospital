import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreatmentPlansService } from '../../../services/treatment-plans.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss'],
  standalone: true,
  imports: [ CommonModule
  ]
})
export class PaymentsComponent implements OnInit {
    payments: any[] = [];
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
    loadPatientData(patientId: string){
      this.treatmentPlansService.getPayments(Number(patientId)).subscribe(res=>{
        this.payments = res.data;
      })
    }
    groupByDate(rows: any[]) {
    return rows.reduce((acc, row) => {
      const dateKey = row.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      
      acc[dateKey].push(row);
      return acc;
    }, {} as Record<string, any[]>);
  }
    constructor(private treatmentPlansService: TreatmentPlansService, private route: ActivatedRoute){

    }
}