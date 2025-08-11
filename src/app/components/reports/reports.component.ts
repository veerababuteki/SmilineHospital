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
    summaryData: any = {};
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
        
        // Set from date to 30 days ago
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
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

    private loadInvoicesData() {
        this.reportsService.getInvoices(this.fromDate, this.toDate, this.selectedPractice.branch_id).subscribe(res => {
            const summary = res.data.summary;
            const data = res.data.data;
            this.summaryData = {
                cost: summary.cost,
                discount: summary.discount,
                incomeAfterDiscount: summary.income_after_discount,
                tax: 0.00,
                invoiceAmount: summary.invoice_amount
            };

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

            const sortedData = data.sort(
                (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                
            sortedData.forEach((inv: any, index: number) =>{
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
                    cost: inv.cost,
                    discount: inv.discount,
                    tax: 0.00,
                    invoiceAmount: inv.invoice_amount,
                    amountPaid: inv.amount_paid
                })
            })
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
        this.reportsService.getPatients(this.fromDate, this.toDate, this.selectedPractice.branch_id).subscribe(res => {
            const summary = res.data.total;
            const data = res.data.data;
            this.summaryData = {
                totalPatients: summary.count,
            };
            this.detailsColumns = [
                { field: 'sNo', header: 'S.No.' },
                { field: 'date', header: 'Date' },
                { field: 'name', header: 'Name' },
                { field: 'patientNumber', header: 'Patient Number' },
            ];
            this.detailsData = [];
            if(data == undefined || data.length == 0){
                this.detailsData = [];
            }
            const sortedData = data.sort(
            (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            
            sortedData.forEach((app: any, index: number) => {
                this.detailsData.push({
                    sNo: index + 1,
                    date: new Date(app.created_at,).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }),
                    name: app.full_name,
                    patientNumber: app.manual_unique_code,
                });
            })
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

    printReport() {
        window.print();
    }

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
}