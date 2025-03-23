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
    debugger;
    const printContent = document.getElementById(this.invoice.key)!.innerHTML;
    const printWindow = window.open('', '', 'width=1200,height=600');
    printWindow!.document.write(`
      <html>
      <head>
        <title>Invoice ${this.invoice.number}</title>
        <style>
          .invoice-container {
  width: 700px;
  margin: auto;
  padding: 20px;
  border: 1px solid #000;
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

/* Table Styles */
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

table, th, td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
}

th {
  background-color: #f8f8f8;
  font-weight: bold;
  text-align: center;
}

td {
  vertical-align: middle;
}

/* Align amounts to the right */
td.amount {
  text-align: right;
}

/* Invoice Summary */
.summary-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end; /* Aligns summary to the right */
}

.summary {
  width: 350px; /* Adjust width for better alignment */
  text-align: right; /* Ensures text is right-aligned */
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
  button {
    display: none;
  }

  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .invoice-container {
    width: 100%;
    border: none;
    box-shadow: none;
  }
}


        </style>
      </head>
      <body>
        ${printContent}
        <script>
          window.onload = function() { window.print(); window.close(); };
        </script>
      </body>
      </html>
    `);
    printWindow!.document.close();
  }
}
