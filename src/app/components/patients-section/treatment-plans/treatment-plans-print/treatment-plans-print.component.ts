import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-treatment-plans-print',
  imports: [CommonModule],
  templateUrl: './treatment-plans-print.component.html',
  styleUrl: './treatment-plans-print.component.scss'
})
export class TreatmentPlansPrintComponent {
  @Input() treatmentPlan: any;
  @Input() grandTotal: any;
  generatedDate: string = '';
  savedPractice: any;

  constructor() {
    this.generatedDate = new Date().toLocaleDateString();
    const selectedPractice = localStorage.getItem('selectedPractice');
    if (selectedPractice) {
      this.savedPractice = JSON.parse(selectedPractice);
    }
    console.log('Grand Total:', this.grandTotal);
  }

  print() {
    const printContent = document.getElementById(`treatmentPlan${this.treatmentPlan.id}`)!;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=1200,height=600');
    printWindow!.document.write(`
      <html>
      <head>
        <style>
        .case-sheet-container {
  width: 700px;
  margin: auto;
  padding: 25px;
  border: 2px solid #000;
  font-family: 'Arial', sans-serif;
  font-size: 14px;
  color: #333;
  background: #fff;
  border-radius: 10px;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
}

/* Header Section */
.clinic-name {
  text-align: center;
  font-size: 26px;
  font-weight: bold;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.clinic-address, .clinic-phone {
  text-align: center;
  font-size: 12px;
  margin: 2px 0;
  color: #555;
}

/* Separator */
hr {
  border: none;
  height: 2px;
  background: #000;
  margin: 15px 0;
}

/* Content Styling */
p {
  margin: 8px 0;
  font-size: 15px;
}

strong {
  color: #000;
}

/* Section Headers */
.section-title {
  font-size: 16px;
  font-weight: bold;
  text-transform: uppercase;
  border-bottom: 1px solid #000;
  padding-bottom: 5px;
  margin-top: 15px;
}

/* Subtle Background Box for Notes */
.notes-box {
  background: #f8f8f8;
  padding: 10px;
  border-left: 4px solid #007bff;
  margin-top: 10px;
  border-radius: 5px;
}

/* Treatment Table */
.treatment-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.treatment-table th, .treatment-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.treatment-table th {
  background-color: #f2f2f2;
  font-weight: bold;
}

.treatment-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.treatment-totals {
  margin-top: 15px;
  text-align: right;
}

.total-row {
  display: flex;
  justify-content: flex-end;
  margin: 5px 0;
}

.total-label {
  font-weight: bold;
  margin-right: 15px;
  min-width: 150px;
}

.grand-total {
  font-size: 16px;
  font-weight: bold;
  border-top: 1px solid #000;
  padding-top: 5px;
}

/* Print Metadata */
.generated-on, .powered-by {
  text-align: center;
  font-size: 12px;
  margin-top: 15px;
  font-style: italic;
  color: #777;
}

/* Print Styling */
@media print {
  button {
    display: none;
  }

  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .case-sheet-container {
    width: 100%;
    border: none;
    box-shadow: none;
  }
}
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
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