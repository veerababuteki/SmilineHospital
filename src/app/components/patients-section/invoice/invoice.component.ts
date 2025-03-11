import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreatmentPlansService } from '../../../services/treatment-plans.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule
  ]
})
export class InvoiceComponent implements OnInit {
  invoices: Record<string, any[]> = {};
  selectedInvoiceList: any[] = [];
  patientId: string | null | undefined;

  constructor(private treatmentPlansService: TreatmentPlansService, private router: Router, private route: ActivatedRoute){}

    ngOnInit(): void {
      this.route.parent?.paramMap.subscribe(params => {
        if(this.patientId == null) {
          this.patientId = params.get('id');
        }
        if (this.patientId) {
          this.fetchInvoices(this.patientId);
        }
      });
    }

    fetchInvoices(patientId: string){
      this.treatmentPlansService.getInvoices(Number(patientId)).subscribe(res => {
        this.invoices = this.groupByDate( res.data.rows)
      })
    }
    getTotalCost(invoiceGroup: unknown): number {
      if (!Array.isArray(invoiceGroup)) {
        return 0; // Return 0 if the value is not an array
      }
      return invoiceGroup.reduce((acc, invoice) => acc + Number(invoice.treatment_plans.total_cost || 0), 0);
    }
    getInvoiceGroupValues(invoiceGroup: any): any[] {
      return Array.isArray(invoiceGroup.value) ? invoiceGroup.value : [];
    }
    onCheckboxChange(invoice: any, invoice_id: any){
      if(invoice[0].isChecked){
        this.selectedInvoiceList.push({invoice_id, amount_paid: this.getTotalCost(invoice)})
      } else{
        this.selectedInvoiceList = this.selectedInvoiceList.filter(item => 
          item.invoice_id !== invoice_id
        );
      }
    }
    groupByDate(rows: any[]) {
      return rows.reduce((acc, row) => {
        const dateKey = row.created_at.split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = {};
        }
    
        const treatmentKey = row.invoice_id;
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

    makePayment(){
      this.selectedInvoiceList.forEach(invoice => {
        this.treatmentPlansService.makePayment({invoice_id: invoice.invoice_id, amount_paid: invoice.amount_paid, payment_mode: 'Cash'}).subscribe(res => {
          if(this.patientId !== null && this.patientId !== undefined){
            this.fetchInvoices(this.patientId)
          }
          this.selectedInvoiceList = this.selectedInvoiceList.filter(item => 
            item.invoice_id !== invoice.invoice_id
          );
        });
      })
      
    }
    navigateToAddPage(){
      this.router.navigate(['patients', this.patientId, 'add-invoice']);
    }
    getSortedDates(): string[] {
      return Object.keys(this.invoices).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    }
}