import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-clinical-notes-print',
  imports: [CommonModule],
  templateUrl: './clinical-notes-print.component.html',
  styleUrl: './clinical-notes-print.component.scss'
})
export class ClinicalNotesPrintComponent{
  @Input() clinicalNotes: any;
  generatedDate: string = '';

 constructor() {
    this.generatedDate = new Date().toLocaleDateString();
  }

  print() {
    const printContent = document.getElementById(`clinicalNotes${this.clinicalNotes.id}`)!;
    if (!printContent) return;

    const styles = `
      body { font-family: Arial, sans-serif; font-size: 14px; }
      .case-sheet-container { width: 100%; padding: 20px; }
      .clinic-name { text-align: center; font-size: 20px; font-weight: bold; }
      hr { border: 1px solid black; }
      p { margin: 5px 0; }
      .generated-on, .powered-by { text-align: center; font-size: 12px; margin-top: 10px; }
      @media print { button { display: none; } }
    `;

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
  border-radius: 10px; /* Rounded corners for a soft look */
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1); /* Light shadow for a professional feel */
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
