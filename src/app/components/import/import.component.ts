import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { UserService } from '../../services/user.service';
import { ImportService } from '../../services/import.service';
import { finalize } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

interface ImportResult {
  originalData?: { [key: string]: string };
  reason?: string;
  missingFields?: string[];
  details?: string;
  error?: string;
  patientNumber?: string;
  manual_unique_code?: string;
}

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTooltipModule,
    ToastModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatExpansionModule,
    MatPaginatorModule
  ],
  providers: [MessageService]
})
export class ImportComponent implements OnInit {
  @ViewChild('dropdownTrigger') dropdownTrigger!: ElementRef;
  @ViewChild('dropdownPanel') dropdownPanel!: ElementRef;

  showPracticesDropdown = false;
  selectedPractice: any = null;
  practices: any[] = [];
  filteredPractices: any[] = [];
  practiceSearchText = '';
  importing = false;
  importResults: any = null;
  currentImportType: string = '';
  
  // Progress tracking
  importProgress: any = null;
  importId: string | null = null;
  progressInterval: any = null;

  importTypes = [
    { value: 'clinical_notes', label: 'Clinical Notes' },
    { value: 'patients', label: 'Patients' },
    { value: 'appointments', label: 'Appointments' },
    { value: 'invoices', label: 'Invoices' },
    { value: 'payments', label: 'Payments' },
    { value: 'treatment_plans', label: 'Treatment Plans' },
    { value: 'procedure_catalog', label: 'Procedure Catalog' },
    // { value: 'amount_due', label: 'Amount Due'} // Commented out - this is a reporting feature, not an import feature
  ];

  selectedFiles: File[] = new Array(this.importTypes.length);

  // Pagination settings
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50, 100];

  // Pagination states for each section
  createdPageIndex = 0;
  skippedPageIndex = 0;
  failedPageIndex = 0;

  constructor(
    private userService: UserService,
    private importService: ImportService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadPractices();
  }

  private loadPractices(): void {
    this.userService.getBranches()
      .subscribe(res => {
        this.practices = res.data;
        this.loadSavedPractice();
      }, error => {
        this.showErrorMessage('Failed to load practices. Please try again.');
        console.error('Error loading branches:', error);
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
    } catch (error) {
      console.error('Error loading saved practice:', error);
      this.showErrorMessage('Error loading saved practice settings.');
    }
  }

  selectPractice(practice: any) {
    this.selectedPractice = practice;
    this.showPracticesDropdown = false;
    localStorage.setItem('selectedPractice', JSON.stringify(practice));
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
        const searchInput = this.dropdownTrigger.nativeElement.querySelector('.practice-search');
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  }

  onFileSelected(event: any, label: string, index: number) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['.csv', '.xlsx', '.xls'];
      const fileType = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validTypes.includes(fileType)) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Invalid file type. Please select a CSV or Excel file.'
        });
        event.target.value = '';
        return;
      }
      this.selectedFiles[index] = file;
    }
  }

  importFile(index: number) {
    const file = this.selectedFiles[index];
    const type = this.importTypes[index].value;
    
    if (!file || !this.selectedPractice?.branch_id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please select a file and practice first'
      });
      return;
    }

    console.log('Importing file:', file);
    console.log('Selected practice:', this.selectedPractice);
    console.log('Branch ID:', this.selectedPractice.branch_id);
    console.log('Import type:', type);

    this.importing = true;
    this.importResults = null;
    this.currentImportType = type;
    this.importProgress = null;
    this.importId = null;
    
    // Reset pagination state for new import
    this.createdPageIndex = 0;
    this.skippedPageIndex = 0;
    this.failedPageIndex = 0;

    let importCall;
    switch(type) {
      case 'patients':
        importCall = this.userService.importPatients(file, this.selectedPractice.branch_id);
        break;
      case 'clinical_notes':
        importCall = this.userService.importClinicalNotes(file, this.selectedPractice.branch_id);
        break;
      case 'appointments':
        importCall = this.importService.importAppointments(file, this.selectedPractice.branch_id);
        break;
      case 'treatment_plans':
        importCall = this.importService.importTreatmentPlans(file, this.selectedPractice.branch_id);
        break;
      case 'invoices':
        importCall = this.importService.importInvoices(file, this.selectedPractice.branch_id);
        break;
      case 'payments':
        importCall = this.importService.importPayments(file, this.selectedPractice.branch_id);
        break;
      case 'procedure_catalog':
        importCall = this.importService.importProcedures(file, this.selectedPractice.branch_id);
        break;
      default:
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Import for ${type} not yet implemented`
        });
        this.importing = false;
        return;
    }

    importCall.pipe(
      finalize(() => {
        this.importing = false;
        console.log('Import completed');
      })
    ).subscribe({
      next: (res) => {
        console.log('Import response:', res);
        console.log('Response data:', res?.data);
        this.importResults = res?.data || null;
        this.importId = res?.data?.importId || null;
        console.log('Import results:', this.importResults);
        console.log('Import ID:', this.importId);
        
        const created = this.importResults?.created?.length || 0;
        const skipped = (this.importResults?.duplicates?.length || 0) + (this.importResults?.skipped?.length || 0);
        const failed = this.importResults?.errors?.length || 0;
        
        // Start progress tracking if import ID is available
        if (this.importId) {
          console.log('Starting progress tracking with import ID:', this.importId);
          this.startProgressTracking();
        } else {
          console.log('No import ID received from backend');
        }
        
        this.messageService.add({
          severity: 'success',
          summary: 'Import Completed',
          detail: `Import completed: ${created} created, ${skipped} skipped, ${failed} failed.`
        });
      },
      error: (err) => {
        console.error('Import error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Import Failed',
          detail: 'Import failed: ' + err
        });
      }
    });
  }

  // Download methods for created records
  downloadCreatedAsCSV() {
    if (!this.importResults?.created?.length) return;
    
    let csvContent = '';
    const type = this.getSelectedType();
    
    if (type === 'patients') {
      csvContent = 'Patient Number,Unique Code\n';
      this.importResults.created.forEach((item: any) => {
        csvContent += `${item.manual_unique_code},${item.unique_code}\n`;
      });
    } else if (type === 'clinical_notes') {
      csvContent = 'Patient Number,Type,Description,Note ID\n';
      this.importResults.created.forEach((item: any) => {
        csvContent += `${item.patientNumber},${item.type},${item.description},${item.noteId}\n`;
      });
    } else if (type === 'procedure_catalog') {
      csvContent = 'Treatment Name,Treatment Cost,Procedure ID\n';
      this.importResults.created.forEach((item: any) => {
        csvContent += `${item.treatmentName},${item.treatmentCost},${item.procedureId}\n`;
      });
    } else {
      // Generic export for other types
      const headers = Object.keys(this.importResults.created[0]);
      csvContent = headers.join(',') + '\n';
      this.importResults.created.forEach((item: any) => {
        csvContent += headers.map(header => item[header]).join(',') + '\n';
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${type}_created_${new Date().toISOString()}.csv`);
  }

  downloadCreatedAsExcel() {
    if (!this.importResults?.created?.length) return;
    
    const type = this.getSelectedType();
    let data: any[] = [];
    
    if (type === 'patients') {
      data = this.importResults.created.map((item: any) => ({
        'Patient Number': item.manual_unique_code,
        'Unique Code': item.unique_code
      }));
    } else if (type === 'clinical_notes') {
      data = this.importResults.created.map((item: any) => ({
        'Patient Number': item.patientNumber,
        'Type': item.type,
        'Description': item.description,
        'Note ID': item.noteId
      }));
    } else if (type === 'procedure_catalog') {
      data = this.importResults.created.map((item: any) => ({
        'Treatment Name': item.treatmentName,
        'Treatment Cost': item.treatmentCost,
        'Procedure ID': item.procedureId
      }));
    } else {
      // Generic export for other types
      data = this.importResults.created;
    }
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Created');
    XLSX.writeFile(wb, `${type}_created_${new Date().toISOString()}.xlsx`);
  }

  // Download methods for skipped records
  downloadSkippedAsCSV() {
    if (!this.importResults?.skipped?.length) return;
    
    const type = this.getSelectedType();
    let csvContent = '';
    
    // Get all unique column names from the original data
    const allColumns = new Set<string>();
    this.importResults.skipped.forEach((item: ImportResult) => {
      if (item.originalData) {
        Object.keys(item.originalData).forEach(key => allColumns.add(key));
      }
    });
    
    // Create header row with all original columns plus status columns
    const headers = [...allColumns, 'Error Reason', 'Missing Fields', 'Additional Details'].join(',');
    csvContent = headers + '\n';

    // Add data rows
    this.importResults.skipped.forEach((item: ImportResult) => {
      const row: string[] = [];
      
      // Add original data in correct column order
      allColumns.forEach(column => {
        const value = item.originalData?.[column] || '';
        row.push(`"${value.toString().replace(/"/g, '""')}"`);
      });
      
      // Add error information
      row.push(`"${item.reason || ''}"`);
      row.push(`"${item.missingFields?.join(', ') || ''}"`);
      row.push(`"${item.details || ''}"`);
      
      csvContent += row.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${type}_skipped_${new Date().toISOString()}.csv`);
  }

  downloadSkippedAsExcel() {
    if (!this.importResults?.skipped?.length) return;
    
    const type = this.getSelectedType();
    
    // Get all unique column names from the original data
    const allColumns = new Set<string>();
    this.importResults.skipped.forEach((item: ImportResult) => {
      if (item.originalData) {
        Object.keys(item.originalData).forEach(key => allColumns.add(key));
      }
    });

    // Prepare data for Excel
    const data = this.importResults.skipped.map((item: ImportResult) => {
      const row: { [key: string]: string } = {};
      
      // Add original data
      allColumns.forEach(column => {
        row[column] = item.originalData?.[column] || '';
      });
      
      // Add error information
      row['Error Reason'] = item.reason || '';
      row['Missing Fields'] = item.missingFields?.join(', ') || '';
      row['Additional Details'] = item.details || '';
      
      return row;
    });
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Skipped');
    XLSX.writeFile(wb, `${type}_skipped_${new Date().toISOString()}.xlsx`);
  }

  // Download methods for failed records
  downloadFailedAsCSV() {
    if (!this.importResults?.errors?.length) return;
    
    const type = this.getSelectedType();
    
    // Get all unique column names from the original data
    const allColumns = new Set<string>();
    this.importResults.errors.forEach((item: ImportResult) => {
      if (item.originalData) {
        Object.keys(item.originalData).forEach(key => allColumns.add(key));
      }
    });
    
    // Create header row with all original columns plus error column
    const headers = [...allColumns, 'Error Message'].join(',');
    let csvContent = headers + '\n';

    // Add data rows
    this.importResults.errors.forEach((item: ImportResult) => {
      const row: string[] = [];
      
      // Add original data in correct column order
      allColumns.forEach(column => {
        const value = item.originalData?.[column] || '';
        row.push(`"${value.toString().replace(/"/g, '""')}"`);
      });
      
      // Add error message
      row.push(`"${item.error || ''}"`);
      
      csvContent += row.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${type}_failed_${new Date().toISOString()}.csv`);
  }

  downloadFailedAsExcel() {
    if (!this.importResults?.errors?.length) return;
    
    const type = this.getSelectedType();
    
    // Get all unique column names from the original data
    const allColumns = new Set<string>();
    this.importResults.errors.forEach((item: ImportResult) => {
      if (item.originalData) {
        Object.keys(item.originalData).forEach(key => allColumns.add(key));
      }
    });

    // Prepare data for Excel
    const data = this.importResults.errors.map((item: ImportResult) => {
      const row: { [key: string]: string } = {};
      
      // Add original data
      allColumns.forEach(column => {
        row[column] = item.originalData?.[column] || '';
      });
      
      // Add error message
      row['Error Message'] = item.error || '';
      
      return row;
    });
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Failed');
    XLSX.writeFile(wb, `${type}_failed_${new Date().toISOString()}.xlsx`);
  }

  getSelectedType(): string {
    return this.currentImportType || '';
  }

  private showErrorMessage(message: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message
    });
  }

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



  // Add helper methods for template
  formatObjectEntries(obj: any): string {
    if (!obj) return '';
    return Object.entries(obj)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }

  getOriginalDataFields(data: any): Array<{key: string, value: string}> {
    if (!data) return [];
    
    // Define the order of fields for each import type
    const fieldOrders: { [key: string]: string[] } = {
      appointments: [
        "Date",
        "Patient Number",
        "DoctorName",
        "Status",
        "Notes",
        "Checked In At",
        "Checked Out At"
      ],
      patients: [
        "Patient Number",
        "Patient Name",
        "Mobile Number",
        "Email Address",
        "Gender",
        "Date of Birth",
        "Age",
        "Blood Group",
        "Address",
        "City",
        "Pincode"
      ],
      clinical_notes: [
        "Date",
        "Patient Number",
        "Patient Name",
        "Doctor",
        "Type",
        "Description"
      ],
      treatment_plans: [
        "Date",
        "Patient Number",
        "Doctor",
        "Treatment Name",
        "Treatment Description",
        "UnitCost",
        "Quantity",
        "Discount",
        "DiscountType",
        "Tooth Diagram"
      ],
      procedure_catalog: [
        "Treatment Name",
        "Treatment Cost",
        "Treatment Notes",
        "Locale"
      ]
    };

    // Try to determine the import type from the fields
    let importType = this.determineImportType(data);
    let orderedFields = fieldOrders[importType] || [];

    // Convert object to array of key-value pairs
    let entries = Object.entries(data).map(([key, value]) => ({
      key,
      value: value as string
    }));

    // Sort entries based on the field order, putting ordered fields first
    return entries.sort((a, b) => {
      const aIndex = orderedFields.indexOf(a.key);
      const bIndex = orderedFields.indexOf(b.key);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.key.localeCompare(b.key);
    });
  }

  getObjectEntries(obj: any): Array<{key: string, value: any}> {
    if (!obj) return [];
    return Object.entries(obj).map(([key, value]) => ({
      key: this.formatFieldName(key),
      value
    }));
  }

  private formatFieldName(key: string): string {
    // Convert camelCase to Title Case with spaces
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private determineImportType(data: any): string {
    const fields = Object.keys(data);
    
    if (fields.includes('DoctorName') && fields.includes('Status')) {
      return 'appointments';
    }
    if (fields.includes('Patient Name') && fields.includes('Mobile Number')) {
      return 'patients';
    }
    if (fields.includes('Type') && fields.includes('Description')) {
      return 'clinical_notes';
    }
    if (fields.includes('Treatment Name') && fields.includes('UnitCost')) {
      return 'treatment_plans';
    }
    if (fields.includes('Treatment Name') && fields.includes('Treatment Cost') && !fields.includes('UnitCost')) {
      return 'procedure_catalog';
    }
    
    return '';
  }

  getPagedData(data: any[], pageIndex: number, pageSize: number): any[] {
    const startIndex = pageIndex * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }

  onCreatedPageChange(event: PageEvent) {
    this.createdPageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  onSkippedPageChange(event: PageEvent) {
    this.skippedPageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  onFailedPageChange(event: PageEvent) {
    this.failedPageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  // Progress tracking methods
  private startProgressTracking() {
    console.log('Starting progress tracking for import ID:', this.importId);
    if (!this.importId) return;
    
    // Clear any existing interval
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    
    // Start polling for progress updates every 2 seconds
    this.progressInterval = setInterval(() => {
      this.fetchProgress();
    }, 2000);
    
    // Fetch initial progress
    this.fetchProgress();
  }

  private async fetchProgress() {
    if (!this.importId) return;
    
    try {
      console.log('Fetching progress for import ID:', this.importId);
      // Call the progress endpoint
      const response = await fetch(`/api/v1/import/progress/${this.importId}`);
      console.log('Progress response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Progress response data:', data);
        if (data?.data) {
          this.importProgress = data.data;
          console.log('Updated import progress:', this.importProgress);
          
          // Stop tracking if import is complete
          if (this.importProgress.status === 'completed' || this.importProgress.status === 'failed') {
            this.stopProgressTracking();
          }
        }
      } else {
        console.error('Progress response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      // Stop tracking on error
      this.stopProgressTracking();
    }
  }

  private stopProgressTracking() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

isObject(value: any): boolean {
  return value && typeof value === 'object' && !Array.isArray(value);
}

  // Clean up on component destroy
  ngOnDestroy() {
    this.stopProgressTracking();
  }
} 