import { CommonModule, NgFor } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-invoice-print',
  imports: [CommonModule],
  templateUrl: './invoice-print.component.html',
  styleUrl: './invoice-print.component.scss'
})
export class InvoicePrintComponent {

  @Input() invoice: any;
  generatedDate: string = '';

  constructor(){
    this.generatedDate = new Date().toLocaleDateString();
  }

  getTotalCost(invoices: any[]): number {
    return invoices.reduce((total, invc) => +total + +invc.treatment_plans.total_cost, 0);
  }

  getInvoiceGroupValues(invoiceGroup: any): any[] {
    return invoiceGroup.value;
  }


  print() {
    const printContent = document.getElementById(this.invoice.key)!.innerHTML;
    const printWindow = window.open('', '', 'width=1200,height=600');
    printWindow!.document.write(`
      <html>
      <head>
        <title>Invoice ${this.invoice.value[0].invoice_id}</title>
        <style>
          .invoice-container {
  width: 700px;
  margin: auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  font-size: 14px;
  color: #333;
  background: #fff;
}

/* Invoice Header */
.invoice-title {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.invoice-address, .invoice-phone {
  text-align: center;
  font-size: 12px;
  margin: 2px 0;
}

/* Separator */
hr {
  border: none;
  height: 1px;
  background: #000;
  margin: 10px 0;
}

/* Treatments Table */
.treatments-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

/* Table Header */
.treatments-table thead {
  font-size: 14px;
  border-bottom: 2px solid black;
}

.treatments-table thead th {
  padding: 10px;
  text-align: center;
}

/* Table Rows */
.treatments-table tbody tr {
  border-bottom: 1px solid #ddd;
}

/* Table Cells */
.treatments-table td {
  padding: 10px;
  text-align: left;
}

/* Align Amounts to Right */
.treatments-table td.amount {
  text-align: right;
  font-weight: bold;
}

.treatments-table td.value {
  text-align: right;
}

/* Subtext Formatting */
.subtext {
  font-size: 12px;
  color: #555;
  display: block;
  margin-top: 2px;
}


/* Invoice Summary */
.summary-container {
  width: 100%;
  text-align: right;
  margin-top: 15px;
}

.summary {
  display: inline-block;
  text-align: right;
  min-width: 250px; /* Ensures consistent alignment */
  font-size: 16px;
  font-weight: bold;
}

.generated-on, .powered-by {
  text-align: center;
  font-size: 12px;
  margin-top: 15px;
}

/* Hide button when printing */
@media print {
  /* Ensure the invoice fits within the print area */
  .invoice-container {
    max-width: 100%; /* Prevents content from overflowing */
    width: 90%; /* Ensures it fits on the page */
    margin: auto;
  }

  .treatments-table {
    border: 1px solid black;
  }

  .treatments-table thead {
    font-weight: bold;
  }

  /* Prevents content from overflowing the page */
  body {
    margin: 0;
    padding: 0;
  }

  /* Adjust summary to align within the printable area */
  .summary-container {
    width: 100%;
    text-align: right;
    padding-right: 10px; /* Prevents it from touching the right margin */
  }
}



        </style>
      </head>
      <body>
        ${printContent}
        <script>
         window.onload = function() { 
            window.print(); 
            window.close(); 
          };
        </script>
      </body>
      </html>
    `);
    printWindow!.document.close();
  }
}
