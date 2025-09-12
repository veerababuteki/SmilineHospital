import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreatmentPlansService } from '../../../services/treatment-plans.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { MessageService } from '../../../services/message.service';
import { ToastModule } from 'primeng/toast';
import { MessageService as Toaster } from 'primeng/api';
import { filter } from 'rxjs/operators';
import { PatientDataService } from '../../../services/patient-data.service';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss'],
  standalone: true,
  imports: [ CommonModule, ToastModule, FormsModule, DialogModule
  ],
  providers: [Toaster]
})
export class PaymentsComponent implements OnInit {
    payments:Record<string, any[]> = {};
  patientId: string | null | undefined;
  uniqueCode: string | null | undefined;
  paymentFilter: string = 'all';
  selectedInvoiceData: any[] = [];
  showInvoiceDialog: boolean = false; 
  constructor(private treatmentPlansService: TreatmentPlansService, private messageService:MessageService, private route: ActivatedRoute, private router: Router, private toaster: Toaster, private patientDataService: PatientDataService){

  }
    ngOnInit(): void {
     this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const state = history.state as { message?: string };

        if (state?.message) {
          setTimeout(() => {
            this.toaster.add({
              severity: 'success',
              summary: 'Success',
              detail: state.message
            });
          }, 500);
        }
        this.treatmentPlansService.getInvoices(Number(this.patientId)).subscribe(res => {
          const existingData = this.patientDataService.getSnapshot();
          const updatedData = {
            ...existingData,
            invoices: res
          };
          this.patientDataService.setData(updatedData);
        });
      });
      this.route.parent?.paramMap.subscribe(params => {
        if(this.patientId == null) {
          this.patientId = params.get('id');
        }
        if (this.patientId) {
          this.loadPatientData(this.patientId);
        }
      });
      this.route.paramMap.subscribe(params => {
        if(this.uniqueCode == null) {
          this.uniqueCode = params.get('source');
        }
        if(this.uniqueCode !== null){
        }
      });
    }
    
openInvoiceMetadata(data: any) {
  try {
    this.selectedInvoiceData = typeof data === 'string' ? JSON.parse(data) : data;
    this.showInvoiceDialog = true;
  } catch (err) {
    console.error('Invalid invoice data', err);
    this.selectedInvoiceData = [];
    this.showInvoiceDialog = false;
  }
}

closeInvoiceDialog() {
  this.showInvoiceDialog = false;
  this.selectedInvoiceData = [];
}

    navigateToAddPayment(){
      this.router.navigate(['/patients', this.patientId, 'add-payment', this.uniqueCode])
    }

    loadPatientData(patientId: string){
      this.treatmentPlansService.getPayments(Number(patientId)).subscribe(res=>{
        this.payments = this.groupByDate(res.data);
      })
    }

    groupByDate(rows: any[]) {
      const grouped = rows.reduce((acc, row) => {
        const dateKey = row.created_at.split('T')[0];
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
   
}