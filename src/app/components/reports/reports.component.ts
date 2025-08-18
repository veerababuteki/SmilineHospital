// reports.component.ts
import { Component, ElementRef, OnInit, HostListener, ViewChild } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { SideTopNavComponent } from "../side-top-nav/side-top-nav.component";
import { LoaderService } from "../../services/loader.service";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { UserService } from "../../services/user.service";
import { catchError, of, Subscription } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";

// PrimeNG Imports
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ReportsService } from "../../services/reports.service";

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    DropdownModule,
    CalendarModule,
    ButtonModule,
    TableModule,
    CardModule
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
    private branchesSubscription!: Subscription;
    practices: any[] = [];
    selectedPractice: any;
    showPracticesDropdown: boolean = false;
    practiceSearchText: string = '';
    filteredPractices: any[] = [];

    // Report related properties
    reportCategories = [
        { label: 'Invoices', value: 'invoices' },
        { label: 'Payments', value: 'payments' },
        { label: 'Appointments', value: 'appointments' },
        { label: 'Amount Due', value: 'amount_due' },
        { label: 'Patients', value: 'patients' },
        { label: 'EMR', value: 'emr' }
    ];

    selectedReportCategory: any = this.reportCategories[0];
    fromDate: Date = new Date();
    toDate: Date = new Date();
    
    // Sample data for demonstration
    summaryData: any = {totalPatients: 0};
    detailsData: any[] = [];
    detailsColumns: any[] = [];

    @ViewChild('dropdownTrigger', { read: ElementRef }) dropdownTrigger!: ElementRef;
    @ViewChild('dropdownPanel', { read: ElementRef }) dropdownPanel!: ElementRef;

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const trigger = this.dropdownTrigger?.nativeElement;
        const panel = this.dropdownPanel?.nativeElement;
        if (
            this.showPracticesDropdown &&
            trigger &&
            (!panel || (!trigger.contains(event.target) && !panel.contains(event.target)))
        ) {
            this.showPracticesDropdown = false;
        }
    }

    constructor(
        private reportsService: ReportsService,
        private userService: UserService,
        private snackBar: MatSnackBar,
        private elementRef: ElementRef,
    ) {
        this.initializeDates();
    }

    ngOnInit() {
        this.branchesSubscription = this.userService.getBranches()
            .pipe(
                catchError(error => {
                    this.showErrorMessage('Failed to load practices. Please try again.');
                    console.error('Error loading branches:', error);
                    return of({ data: [] });
                })
            )
            .subscribe(res => {
                this.practices = res.data;
                this.loadSavedPractice();
            });
        
    }

    private initializeDates(): void {
  const today = new Date();

  this.toDate = new Date(today);
  this.toDate.setHours(23, 59, 59, 999);  // include entire day

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);     // start of the day
  this.fromDate = thirtyDaysAgo;
}


    private showErrorMessage(message: string) {
        this.snackBar.open(message, 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
        });
    }

    private loadSavedPractice(): void {
        try {
            const savedPractice = localStorage.getItem('selectedPractice');
            if (savedPractice) {
                this.selectedPractice = JSON.parse(savedPractice);
            } else if (this.practices && this.practices.length > 0) {
                this.selectedPractice = this.practices[0];
                localStorage.setItem('selectedPractice', JSON.stringify(this.selectedPractice));
            }
            this.loadReportData();

        } catch (error) {
            console.error('Error loading saved practice:', error);
            this.showErrorMessage('Error loading saved practice settings.');
        }
    }

    selectPractice(practice: any) {
        this.selectedPractice = practice;
        this.showPracticesDropdown = false;
        localStorage.setItem('selectedPractice', JSON.stringify(practice));
        this.loadReportData();
    }

    filterPractices() {
        if (!this.practiceSearchText.trim()) {
            this.filteredPractices = [...this.practices];
            return;
        }
        
        const searchTerm = this.practiceSearchText.toLowerCase().trim();
        this.filteredPractices = this.practices.filter(practice => 
            practice.branch_name.toLowerCase().includes(searchTerm) || 
            practice.branch_id.toString().includes(searchTerm)
        );
    }

    togglePracticesDropdown() {
        this.showPracticesDropdown = !this.showPracticesDropdown;
        
        if (this.showPracticesDropdown) {
            this.practiceSearchText = '';
            this.filteredPractices = [...this.practices];
            
            setTimeout(() => {
                const searchInput = this.elementRef.nativeElement.querySelector('.practice-search');
                if (searchInput) {
                    searchInput.focus();
                }
            }, 100);
        }
    }

    onReportCategoryChange() {
        this.loadReportData();
    }

    onDateChange() {
  if (this.fromDate) {
    this.fromDate.setHours(0, 0, 0, 0); // Start of day
  }

  if (this.toDate) {
    this.toDate.setHours(23, 59, 59, 999); // End of day
  }

  this.loadReportData();
}

    showDatePickers(): boolean {
        return this.selectedReportCategory?.value !== 'amount_due';
    }

    loadReportData() {
        // This is sample data - replace with actual API calls
        switch (this.selectedReportCategory?.value) {
            case 'invoices':
                this.loadInvoicesData();
                break;
            case 'payments':
                this.loadPaymentsData();
                break;
            case 'appointments':
                this.loadAppointmentsData();
                break;
            case 'amount_due':
                this.loadAmountDueData();
                break;
            case 'patients':
                this.loadPatientsData();
                break;
            case 'emr':
                this.loadEMRData();
                break;
            default:
                this.loadInvoicesData();
        }
    }

    // private loadInvoicesData() {
    //     this.reportsService.getInvoices(this.fromDate, this.toDate, this.selectedPractice.branch_id).subscribe(res => {
    //         const summary = res.data.summary;
    //         const data = res.data.data;
    //         this.summaryData = {
    //             cost: summary.cost,
    //             discount: summary.discount,
    //             incomeAfterDiscount: summary.income_after_discount,
    //             tax: 0.00,
    //             invoiceAmount: summary.invoice_amount
    //         };

    //         this.detailsColumns = [
    //             { field: 'sNo', header: 'S.No.' },
    //             { field: 'date', header: 'Date' },
    //             { field: 'invoiceNumber', header: 'Invoice Number' },
    //             { field: 'patient', header: 'Patient' },
    //             { field: 'treatments', header: 'Treatments & Products' },
    //             { field: 'cost', header: 'Cost (INR)' },
    //             { field: 'discount', header: 'Discount (INR)' },
    //             { field: 'tax', header: 'Tax (INR)' },
    //             { field: 'invoiceAmount', header: 'Invoice Amount (INR)' },
    //             { field: 'amountPaid', header: 'Amount Paid (INR)' }
    //         ];
    //         this.detailsData = [];

    //         const sortedData = data.sort(
    //             (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
    //             );
                
    //         sortedData.forEach((inv: any, index: number) =>{
    //             this.detailsData.push({
    //                 sNo: index + 1,
    //                 date: new Date(inv.date).toLocaleDateString('en-GB', {
    //                   day: '2-digit',
    //                   month: 'short',
    //                   year: 'numeric'
    //                 }),
    //                 invoiceNumber: inv.invoice_number,
    //                 patient: inv.patient,
    //                 treatments: inv.treatments_products,
    //                 cost: inv.cost,
    //                 discount: inv.discount,
    //                 tax: 0.00,
    //                 invoiceAmount: inv.invoice_amount,
    //                 amountPaid: inv.amount_paid
    //             })
    //         })
    //     });
    // }
    private loadInvoicesData() {
    this.reportsService.getInvoices(this.fromDate, this.toDate, this.selectedPractice.branch_id).subscribe(res => {
        const data = res.data.data;
        
        // Initialize summary totals
        let totalCost = 0;
        let totalDiscount = 0;
        let totalIncomeAfterDiscount = 0;
        let totalTax = 0;
        let totalInvoiceAmount = 0;
        let totalAmountPaid = 0;

        this.detailsColumns = [
            { field: 'sNo', header: 'S.No.' },
            { field: 'date', header: 'Date' },
            { field: 'invoiceNumber', header: 'Invoice Number' },
            { field: 'patient', header: 'Patient' },
            { field: 'treatments', header: 'Treatments & Products' },
            { field: 'cost', header: 'Cost (INR)' },
            { field: 'discount', header: 'Discount (INR)' },
            { field: 'tax', header: 'Tax (INR)' },
            { field: 'invoiceAmount', header: 'Invoice Amount (INR)' },
            { field: 'amountPaid', header: 'Amount Paid (INR)' }
        ];
        
        this.detailsData = [];

        if (data && data.length > 0) {
            const sortedData = data.sort(
                (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            
            sortedData.forEach((inv: any, index: number) => {
                // Convert string values to numbers for calculation
                const cost = parseFloat(inv.cost) || 0;
                const discount = parseFloat(inv.discount) || 0;
                const tax = 0.00; // As you're setting this to 0
                const invoiceAmount = parseFloat(inv.invoice_amount) || 0;
                const amountPaid = parseFloat(inv.amount_paid) || 0;
                const incomeAfterDiscount = cost - discount;

                // Add to running totals
                totalCost += cost;
                totalDiscount += discount;
                totalIncomeAfterDiscount += incomeAfterDiscount;
                totalTax += tax;
                totalInvoiceAmount += invoiceAmount;
                totalAmountPaid += amountPaid;

                this.detailsData.push({
                    sNo: index + 1,
                    date: new Date(inv.date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    }),
                    invoiceNumber: inv.invoice_number,
                    patient: inv.patient,
                    treatments: inv.treatments_products,
                    cost: cost.toFixed(2),
                    discount: discount.toFixed(2),
                    tax: tax.toFixed(2),
                    invoiceAmount: invoiceAmount.toFixed(2),
                    amountPaid: amountPaid.toFixed(2)
                });
            });
        }

        // Set summary data based on calculated totals from detail rows
        this.summaryData = {
            cost: totalCost.toFixed(2),
            discount: totalDiscount.toFixed(2),
            incomeAfterDiscount: totalIncomeAfterDiscount.toFixed(2),
            tax: totalTax.toFixed(2),
            invoiceAmount: totalInvoiceAmount.toFixed(2),
            amountPaid: totalAmountPaid.toFixed(2) // Added this for completeness
        };

        console.log('Summary Data:', this.summaryData);
        console.log('Details Data Count:', this.detailsData.length);
    });
}

    private loadPaymentsData() {
        this.reportsService.getPayments(this.fromDate, this.toDate, this.selectedPractice.branch_id).subscribe(res => {
            const summary = res.data.summary;
            const data = res.data.data;
            this.summaryData = {
                
                totalPayments: summary.total_payment,
                totalAdvance: summary.total_advance,
                
            };
            console.log(this.summaryData.totalPayments);

            this.detailsColumns = [
                { field: 'sNo', header: 'S.No.' },
                { field: 'date', header: 'Inovice Date' },
                { field: 'patient', header: 'Patient' },
                { field: 'receiptNumber', header: 'Receipt Number' },
                { field: 'invoice', header: 'Invoice(s)' },
                { field: 'treatments', header: 'Treatments & Products' },
                { field: 'amountPaid', header: 'Amount Paid (INR)' },
                { field: 'advanceAmount', header: 'Advance Amount (INR)' },
                { field: 'paymentInfo', header: 'Payment Info' },
            ];
            this.detailsData = [];

            if(data == undefined || data.length == 0){
                this.detailsData = [];
            }
            const sortedData = data.sort(
                (a: any, b: any) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime()
            );

            sortedData.forEach((pay: any, index: number) => {
                this.detailsData.push({
                    sNo: index + 1,
                    date: new Date(pay.invoice_date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }),
                    patient: pay.patient,
                    receiptNumber: pay.receipt_number,
                    invoice: pay.invoices,
                    treatments: pay.treatments_products,
                    amountPaid: pay.amount_paid,
                    advanceAmount: pay.advance_amount,
                    paymentInfo: pay.payment_info
                });
            })
        });
    }

    private loadAppointmentsData() {
        this.reportsService.getAppointments(this.fromDate, this.toDate, this.selectedPractice.branch_id).subscribe(res => {
            const summary = res.data.total;
            const data = res.data.data;
            this.summaryData = {
                totalAppointments: summary.count,
            };
            this.detailsColumns = [
                { field: 'sNo', header: 'S.No.' },
                { field: 'date', header: 'Date' },
                { field: 'time', header: 'Scheduled At' },
                { field: 'patient', header: 'Patient' },
                { field: 'doctor', header: 'Doctor' },
                { field: 'category', header: 'Category' },
            ];
            this.detailsData = [];
            if(data == undefined || data.length == 0){
                this.detailsData = [];
            }
            const sortedData = data.sort(
                (a: any, b: any) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
            );

            sortedData.forEach((app: any, index: number) => {
                this.detailsData.push({
                    sNo: index + 1,
                    date: new Date(app.appointment_date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }),
                    time: app.appointment_time,
                    patient: app.patient_name,
                    doctor: app.doctor_name !== undefined && app.doctor_name !== null && app.doctor_name !== '' ? 'Dr. ' + app.doctor_name: '',
                    category: app.category_name
                });
            })
        });
    }

    private loadAmountDueData() {
        this.reportsService.getAmountDue(this.selectedPractice.branch_id).subscribe(res => {
            const summary = res.data.summary;
            const data = res.data.data;
            this.summaryData = {
                totalAmountDue: summary.total_due,
            };
            this.detailsColumns = [
                { field: 'sNo', header: 'S.No.' },
                { field: 'name', header: 'Name' },
                { field: 'amountDue', header: 'Amount Due(INR)' },
                { field: 'lastInvoice', header: 'Last Invoice(INR)' },
                { field: 'lastPayment', header: 'Last Payment (INR)' },
            ];
            this.detailsData = [];
            if(data == undefined || data.length == 0){
                this.detailsData = [];
            }
            data.forEach((app: any, index: number) => {
                this.detailsData.push({
                    sNo: index + 1,
                    name: app.patient_name,
                    amountDue: app.amount_due,
                    lastInvoice: app.last_invoice,
                    lastPayment: app.last_payment,
                });
            })
        });
    }

    
   private loadPatientsData() {
  this.reportsService
    .getPatients(this.fromDate, this.toDate, this.selectedPractice.branch_id)
    .subscribe(res => {
      const summary = res.data.total || {};
      const data = res.data.data || [];

      // ✅ Just update the property directly
      this.summaryData.totalPatients = summary.count || 0;
      console.log(this.summaryData);

      this.detailsColumns = [
        { field: 'sNo', header: 'S.No.' },
        { field: 'date', header: 'Date' },
        { field: 'name', header: 'Name' },
        { field: 'patientNumber', header: 'Patient Number' },
      ];

      const sortedData = data.sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      this.detailsData = sortedData.map((app: any, index: number) => ({
        sNo: index + 1,
        date: new Date(app.created_at).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        name: app.full_name,
        patientNumber: app.manual_unique_code
      }));
    });
}


    private loadEMRData() {
        this.reportsService.getEMR(this.fromDate, this.toDate, this.selectedPractice.branch_id).subscribe(res => {
            const summary = res.data.summary;
            const data = res.data.data;
            this.summaryData = {
                totalTreatments: summary.total_procedures,
            };
            this.detailsColumns = [
                { field: 'sNo', header: 'S.No.' },
                { field: 'date', header: 'Performed on' },
                { field: 'name', header: 'Name' },
                { field: 'performedBy', header: 'Performed by' },
            ];
            this.detailsData = [];
            if(data == undefined || data.length == 0){
                this.detailsData = [];
            }
            const sortedData = data.sort(
                (a: any, b: any) => new Date(b.performed_on).getTime() - new Date(a.performed_on).getTime()
                );

            sortedData.forEach((app: any, index: number) => {
                this.detailsData.push({
                    sNo: index + 1,
                    date: new Date(app.performed_on,).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }),
                    name: app.procedure_name,
                    performedBy: 'Dr. ' + app.performed_by,
                });
            })
        });
    }

    // printReport() {
    //     window.print();
    // }

    sendNotification() {
        // Implement send notification functionality
        this.snackBar.open('Notification sent successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
        });
    }

    ngOnDestroy() {
        if (this.branchesSubscription) {
            this.branchesSubscription.unsubscribe();
        }
    }

    printReport() {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
        this.snackBar.open('Unable to open print window. Please check your browser settings.', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
        });
        return;
    }

    const printContent = this.generatePrintContent();
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
        <title>Report - ${this.selectedReportCategory?.label}</title>
        <style>
            ${this.getPrintStyles()}
        </style>
        </head>
        <body>
        ${printContent}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
        setTimeout(() => {
        printWindow.print();
        printWindow.close();
        }, 250);
    };
    }

    private generatePrintContent(): string {
    const currentDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    
    const dateRange = this.showDatePickers() ? 
        `From: ${this.fromDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} 
        To: ${this.toDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` 
        : '';

    let summaryHtml = this.generateSummaryHtml();
    let detailsHtml = this.generateDetailsHtml();

    return `
        <div class="print-header">
        <h1>Reports</h1>
        <div class="report-info">
            <p><strong>Practice:</strong> ${this.selectedPractice?.branch_name || 'N/A'}</p>
            <p><strong>Report Type:</strong> ${this.selectedReportCategory?.label || 'N/A'}</p>
            ${dateRange ? `<p><strong>Period:</strong> ${dateRange}</p>` : ''}
            <p><strong>Generated on:</strong> ${currentDate}</p>
        </div>
        </div>

        <div class="print-summary">
        <h2>Summary</h2>
        ${summaryHtml}
        </div>

        <div class="print-details">
        <h2>Details</h2>
        ${detailsHtml}
        </div>
    `;
    }

    private generateSummaryHtml(): string {
    const categoryValue = this.selectedReportCategory?.value;
    
    switch (categoryValue) {
        case 'invoices':
        return `
            <div class="summary-grid">
            <div class="summary-row">
                <span class="label">Cost (INR):</span>
                <span class="value">${this.formatCurrency(this.summaryData.cost)}</span>
            </div>
            <div class="summary-row">
                <span class="label">Discount (INR):</span>
                <span class="value">${this.formatCurrency(this.summaryData.discount)}</span>
            </div>
            <div class="summary-row">
                <span class="label">Income after Discount (INR):</span>
                <span class="value">${this.formatCurrency(this.summaryData.incomeAfterDiscount)}</span>
            </div>
            <div class="summary-row">
                <span class="label">Tax (INR):</span>
                <span class="value">₹0.00</span>
            </div>
            <div class="summary-row">
                <span class="label">Invoice Amount (INR):</span>
                <span class="value">${this.formatCurrency(this.summaryData.invoiceAmount)}</span>
            </div>
            </div>
        `;
        
        case 'payments':
        return `
            <div class="summary-grid">
            <div class="summary-row">
                <span class="label">Total Payments (INR):</span>
                <span class="value">${this.formatCurrency(this.summaryData.totalPayments)}</span>
            </div>
            <div class="summary-row">
                <span class="label">Total Advance Payment (INR):</span>
                <span class="value">${this.formatCurrency(this.summaryData.totalAdvance)}</span>
            </div>
            </div>
        `;
        
        case 'appointments':
        return `
            <div class="summary-grid">
            <div class="summary-row">
                <span class="label">Total Appointments:</span>
                <span class="value">${this.summaryData.totalAppointments}</span>
            </div>
            </div>
        `;
        
        case 'amount_due':
        return `
            <div class="summary-grid">
            <div class="summary-row">
                <span class="label">Total Amount Due (INR):</span>
                <span class="value">${this.formatCurrency(this.summaryData.totalAmountDue)}</span>
            </div>
            </div>
        `;
        
        case 'patients':
        return `
            <div class="summary-grid">
            <div class="summary-row">
                <span class="label">Total Patients:</span>
                <span class="value">${this.summaryData.totalPatients}</span>
            </div>
            </div>
        `;
        
        case 'emr':
        return `
            <div class="summary-grid">
            <div class="summary-row">
                <span class="label">Total Treatments:</span>
                <span class="value">${this.summaryData.totalTreatments}</span>
            </div>
            </div>
        `;
        
        default:
        return '<p>No summary data available.</p>';
    }
    }

    private generateDetailsHtml(): string {
    if (!this.detailsData || this.detailsData.length === 0) {
        return '<p>No detail data available for the selected report filters.</p>';
    }

    let tableHtml = '<table class="details-table">';
    
    // Table header
    tableHtml += '<thead><tr>';
    this.detailsColumns.forEach(col => {
        tableHtml += `<th>${col.header}</th>`;
    });
    tableHtml += '</tr></thead>';
    
    // Table body
    tableHtml += '<tbody>';
    this.detailsData.forEach(row => {
        tableHtml += '<tr>';
        this.detailsColumns.forEach(col => {
        let cellValue = row[col.field] || '';
        
        // Format currency fields
        if (this.isCurrencyField(col.field)) {
            cellValue = this.formatCurrency(cellValue);
        }
        
        tableHtml += `<td>${cellValue}</td>`;
        });
        tableHtml += '</tr>';
    });
    tableHtml += '</tbody>';
    
    tableHtml += '</table>';
    return tableHtml;
    }

    private isCurrencyField(fieldName: string): boolean {
    const currencyFields = [
        'cost', 'discount', 'tax', 'invoiceAmount', 'amountPaid', 
        'amountDue', 'lastInvoice', 'lastPayment', 'advanceAmount'
    ];
    return currencyFields.includes(fieldName);
    }

    private formatCurrency(value: any): string {
    if (value === null || value === undefined || value === '') {
        return '₹0.00';
    }
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(value));
    }

    private getPrintStyles(): string {
    return `
        * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        }

        body {
        font-family: Arial, sans-serif;
        font-size: 12px;
        line-height: 1.4;
        color: #333;
        max-width: 100%;
        margin: 0;
        padding: 20px;
        }

        .print-header {
        text-align: center;
        margin-bottom: 8px;
        border-bottom: 2px solid #333;
        padding-bottom: 8px;
        }

        .print-header h1 {
        font-size: 24px;
        margin-bottom: 10px;
        color: #333;
        }

        .report-info {
        text-align: left;
        display: inline-block;
        }

        .report-info p {
        margin: 3px 0;
        font-size: 14px;
        }

        .print-summary, .print-details {
        margin-bottom: 15px;
        }

        .print-summary h2, .print-details h2 {
        font-size: 18px;
        margin-bottom: 8px;
        color: #333;
        border-bottom: 1px solid #ddd;
        padding-bottom: 3px;
        }

        .summary-grid {
        display: table;
        width: 100%;
        border-collapse: collapse;
        }

        .summary-row {
        display: table-row;
        border-bottom: 1px solid #eee;
        }

        .summary-row .label, .summary-row .value {
        display: table-cell;
        padding: 8px 12px;
        border: 1px solid #ddd;
        }

        .summary-row .label {
        font-weight: bold;
        background-color: #f5f5f5;
        width: 60%;
        }

        .summary-row .value {
        text-align: right;
        font-weight: bold;
        width: 40%;
        }

        .details-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
        }

        .details-table th {
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        padding: 8px 6px;
        text-align: left;
        font-weight: bold;
        font-size: 11px;
        }

        .details-table td {
        border: 1px solid #ddd;
        padding: 6px;
        font-size: 10px;
        word-wrap: break-word;
        }

        .details-table tr:nth-child(even) {
        background-color: #f9f9f9;
        }

        .details-table tr:hover {
        background-color: #f5f5f5;
        }

        /* Specific column widths for better layout */
        .details-table th:first-child,
        .details-table td:first-child {
        width: 40px;
        text-align: center;
        }

        /* Currency columns */
        .details-table td:nth-last-child(-n+5) {
        text-align: right;
        }

        @media print {
        body {
            margin: 0;
            padding: 15px;
        }

        .print-header {
            page-break-after: avoid;
            margin-bottom: 5px;
            padding-bottom: 5px;
        }

        .print-summary {
            page-break-before: avoid;
            page-break-after: avoid;
            margin-bottom: 10px;
        }

        .print-summary h2,
        .print-details h2 {
            margin-bottom: 5px;
            padding-bottom: 2px;
        }

        /* Allow table to break across pages */
        .details-table {
            page-break-inside: auto;
        }

        /* Keep header repeated on every page */
        .details-table thead {
            display: table-header-group;
        }

        /* Prevent row split */
        .details-table tr {
            page-break-inside: avoid;
        }
        }

        @page {
        margin: 1cm;
        size: A4;
        }
    `;
    }}