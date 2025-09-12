import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { TreatmentPlansService } from '../../../services/treatment-plans.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoicePrintComponent } from './invoice-print/invoice-print.component';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { MenuItem } from 'primeng/api';
import { MessageService } from '../../../services/message.service';
import { PatientDataService } from '../../../services/patient-data.service';

@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule,
    InvoicePrintComponent,NgFor,
    MenuModule,
    ButtonModule
  ]
})
export class InvoiceComponent implements OnInit {
  invoices: Record<string, any[]> = {};
  selectedInvoiceList: any[] = [];
  patientId: string | null | undefined;
  items: MenuItem[] = [];
  currentInvoiceKey: any;
  uniqueCode: string | null | undefined;
  paymentFilter: string = 'all';
  
  constructor(private treatmentPlansService: TreatmentPlansService, 
              private patientDataService: PatientDataService,
    private router: Router, private route: ActivatedRoute){}

    ngOnInit(): void {
      this.items = [
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          command: (event) => this.editInvoice(event)
        },
        {
          label: 'Cancel',
          icon: 'pi pi-times',
          command: (event) => this.cancelInvoice(event)
        }
      ];
      this.patientDataService.data$.subscribe((data) => {
        const invoices = data?.invoices?.data?.rows || [];
        this.invoices = this.groupByDate(invoices)
      });
      this.route.parent?.paramMap.subscribe(params => {
        if(this.patientId == null) {
          this.patientId = params.get('id');
        }
        if (this.patientId) {
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

    editInvoice(invoiceKey: any): void {
      // Find the invoice data and pass it to the add-invoice component
      const invoiceData = this.findInvoiceByKey(invoiceKey);
      
      this.router.navigate(['patients', this.patientId, 'add-invoice', this.uniqueCode], {
        state: { mode: 'edit', invoiceData: invoiceData, invoiceKey: invoiceKey }
      });
    }

    payInvoice(event: any) {
      const invoiceKey = event.item.data;
      console.log('Paying invoice:', invoiceKey);
    }
    
    cancelInvoice(event: any) {
      const invoiceKey = event;
      this.treatmentPlansService.cancelInvoice(invoiceKey).subscribe(res => {
        if(this.patientId !== null && this.patientId !== undefined){
          this.fetchInvoices(this.patientId)
        }
      });
    }
    
    setCurrentInvoice(invoiceKey: any): void {
      this.currentInvoiceKey = invoiceKey;
      console.log(invoiceKey)
      // Update menu items with the current invoice key as data
      this.items = [
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          command: (event) => this.editInvoice(this.currentInvoiceKey)
        },
        {
          label: 'Cancel',
          icon: 'pi pi-times',
          command: () => this.cancelInvoice(this.currentInvoiceKey)
        }
      ];
    }

    findInvoiceByKey(invoiceKey: any): any[] {
      for (const date of this.getSortedDates()) {
        if (this.invoices[date] && this.invoices[date][invoiceKey]) {
          return this.invoices[date][invoiceKey];
        }
      }
      return [];
    }

    fetchInvoices(patientId: string){
      this.treatmentPlansService.getInvoices(Number(patientId)).subscribe(res => {
        const existingData = this.patientDataService.getSnapshot();

        const updatedData = {
          ...existingData,
          invoices: res
        };
        this.patientDataService.setData(updatedData);
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
        const newDate = new Date(row.created_at)
        const options = { timeZone: 'Asia/Kolkata' };
        const istDateStr = newDate.toLocaleDateString('en-CA', options); // en-CA gives YYYY-MM-DD format
    
        // Use IST date as the key
        const dateKey = istDateStr;
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
      this.router.navigate(['patients', this.patientId, 'add-payment', this.uniqueCode], 
        {
          state: {
            procedures: this.selectedInvoiceList.map(event => ({
              invoice_id: event.invoice_id,
            }))
          }}
      );
      // this.selectedInvoiceList.forEach(invoice => {
      //   this.treatmentPlansService.makePayment({invoice_id: invoice.invoice_id, amount_paid: invoice.amount_paid, payment_mode: 'Cash'}).subscribe(res => {
      //     if(this.patientId !== null && this.patientId !== undefined){
      //       this.fetchInvoices(this.patientId)
      //     }
      //     this.selectedInvoiceList = this.selectedInvoiceList.filter(item => 
      //       item.invoice_id !== invoice.invoice_id
      //     );
      //   });
      // })
      
    }

    navigateToAddPage(){
      this.router.navigate(['patients', this.patientId, 'add-invoice', this.uniqueCode]);
    }

    getSortedDates(): string[] {
      return Object.keys(this.invoices).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    }

    getInitialTeeth(teethSet: string): string {
      if (!teethSet) return '';
      const teeth = teethSet.split(',');
      if (teeth.length <= 2) return teethSet;
      return `${teeth[0]}, ${teeth[1]}...`;
    }
}