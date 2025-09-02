// Updated sfc-form.component.ts - Modified methods for row-specific actions
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, Validators } from '@angular/forms';
import { CustomCalendarComponent } from './custom-calendar/custom-calendar.component';
import { SfcService } from '../../../../services/sfc.service';
import { UserService } from '../../../../services/user.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-sfc-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomCalendarComponent, ToastModule],
  templateUrl: './sfc-form.component.html',
  styleUrl: './sfc-form.component.scss',
  providers: [MessageService]
})
export class SfcFormComponent {
  @Input() patientId: string = '';
  @Input() patientName: string = '';
  @Output() onSfcAdded = new EventEmitter<void>();

  constructor(private sfcService: SfcService, private userService: UserService, private messageService: MessageService) {}
  // Your existing code remains the same...
  editId: number | null = null;
  newEntry: {
    [key: string]: string;
    date: string;
    name: string;
    patientId: string;
    ageRelation: string;
    profileOccupation: string;
    smilinePatient: string;
    doctorFrontOfficeComment: string;
    doctorAdvice: string;
    frontOfficeRemarks: string;
    referredBy: string;
  } = {
    date: '',
    name: '',
    patientId: '',
    ageRelation: '',
    profileOccupation: '',
    smilinePatient: 'Y',
    doctorFrontOfficeComment: '',
    doctorAdvice: '',
    frontOfficeRemarks: '',
    referredBy: ''
  };

  // Add property to track open dropdown
  openDropdownIndex: number | null = null;

  // Add this method to handle date selection
  onDateSelected(date: string) {
    this.newEntry.date = date;
  }

  // Your existing methods remain the same...
  entries: any[] = [];
  editingIndex: number | null = null;
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 25;
  selectAll: boolean = false;
  submitted: boolean = false;

  ngOnInit() {
        this.getSfcEntries();
    }

  filteredData: any[] = [];

   getSfcEntries() {
  this.sfcService.getAllSfcEntries().subscribe({
    next: (res) => {
      const data = res?.data || [];
      this.entries = data.map((entry: any) => ({
        id: entry.id,
        date: entry.date,
        name: entry.patient_name,
        patientId: entry.patient_id,
        ageRelation: entry.age,
        profileOccupation: entry.occupation,
        smilinePatient: entry.smiline_patient,
        doctorFrontOfficeComment: entry.doctor_front_office_comment,
        doctorAdvice: entry.doctor_advice_for_lead_gen,
        frontOfficeRemarks: entry.front_office_remarks,
      }));
      this.filteredData = [...this.entries];
    },
    error: (err) => {
      console.error("Failed to load SFC data:", err);
    }
  });
}

  // All your existing methods stay exactly the same...
  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.filteredEntries().length);
  }

  paginationRange(): number[] {
    const total = this.totalPages();
    const range: number[] = [];
    for (let i = 1; i <= total; i++) {
      range.push(i);
    }
    return range;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage = page;
    }
  }

  resetForm() {
  this.newEntry = {
    date: '',
    name: '',
    patientId: '',
    ageRelation: '',
    profileOccupation: '',
    smilinePatient: 'Y',
    doctorFrontOfficeComment: '',
    doctorAdvice: '',
    frontOfficeRemarks: '',
    referredBy: ''
  };
  this.editingIndex = null;
  this.editId = null;
  this.submitted = false;
}


  editEntry(entry: any) {
    this.editingIndex = this.entries.indexOf(entry);
    this.editId = entry.id;
    console.log(entry)
    this.newEntry = { ...entry };
    this.openDropdownIndex = null; // Close dropdown after action
  }

  
addEntry() {
  this.submitted = true;


  const requiredFields = [
    this.newEntry.date,
    this.newEntry.name,
    this.newEntry.patientId,
    this.newEntry.ageRelation,
    this.newEntry.profileOccupation,
    this.newEntry.smilinePatient,
    this.newEntry.doctorFrontOfficeComment,
    this.newEntry.doctorAdvice,
    this.newEntry.frontOfficeRemarks
  ];

  const isEmpty = requiredFields.some(field => !field || field.toString().trim() === '');
  if (isEmpty) return;

  // Character-only validation for name
  if (!/^[A-Za-z ]+$/.test(this.newEntry.name)) {
    this.messageService.add({
      severity: 'error',
      summary: 'Invalid Name',
      detail: 'Name should contain characters only.'
    });
    return;
  }

  // Check for negative ageRelation
  if (Number(this.newEntry.ageRelation) < 0) {
    this.messageService.add({
      severity: 'error',
      summary: 'Invalid Age',
      detail: 'Age cannot be negative.'
    });
    return;
  }

  // If editing, skip patient check and update directly
  if (this.editId) {
    this.addSfcEntry();
    return;
  }


  this.userService.getPatient(this.newEntry.patientId).subscribe({
    next: (response) => {
      const patient = response.data?.[0];

      if (patient && String(this.newEntry.patientId) === String(patient.manual_unique_code)) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Action Not Allowed',
          detail: 'A patient with this Patient ID already exists. Cannot add SFC entry.'
        });
        return; // stop execution
      }

      this.addSfcEntry();
    },
    error: (error) => {
      // Ignore 400/404 → add SFC entry
      if (error.status === 400 || error.status === 404) {
        this.addSfcEntry();
      } else {
        console.error('Unexpected error checking patient:', error);
        this.addSfcEntry();
      }
    }
  });
}

// Separate function to add/update SFC entry
private addSfcEntry() {
  if (this.editId) {
    this.sfcService.updateSfcEntry(this.editId, this.newEntry).subscribe({
      next: (response) => {
        const updatedEntry = { id: this.editId, ...this.newEntry };
        const index = this.entries.findIndex(e => e.id === this.editId);
        if (index !== -1) this.entries[index] = updatedEntry;

        const filteredIndex = this.filteredData.findIndex(e => e.id === this.editId);
        if (filteredIndex !== -1) this.filteredData[filteredIndex] = updatedEntry;

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Entry Updated Successfully.'
        });
        this.resetForm();
      },
      error: (error) => console.error('Failed to update entry:', error)
    });
    return;
  }

  // Add new SFC entry
  // Set the referredBy field if patientId is provided
  if (this.patientId) {
    this.newEntry.referredBy = this.patientId;
  }
  
  this.sfcService.addSfcEntry(this.newEntry).subscribe({
    next: (response) => {
      const newRecord = { id: response.data?.id || response.id, ...this.newEntry };
      this.entries.unshift(newRecord);
      this.filteredData = [...this.entries];
      this.resetForm();
      this.currentPage = 1;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Entry Added Successfully.'
      });
      
      // Emit event to notify parent component
      this.onSfcAdded.emit();
    },
    error: (error) => console.error('Failed to add entry:', error)
  });
}



removeEntry(entry: any) {
  this.userService.getPatient(entry.patientId).subscribe({
    next: (response) => {
      const patient = response.data?.[0];
      if (patient && String(entry.patientId) === String(patient.manual_unique_code)) {
        // If patient exists in backend → do not delete
        this.messageService.add({
          severity: 'warn',
          summary: 'Action Not Allowed',
          detail: 'This record belongs to an existing patient and cannot be removed.'
        });
        return;
      }
      this.confirmAndDelete(entry);
    },
    error: () => {
      // If getPatient fails (like 400), still allow deletion
      this.confirmAndDelete(entry);
    }
  });
}

confirmAndDelete(entry: any) {
  console.log(entry.id, "Entry ID")
  if (!confirm('Are you sure you want to remove this entry?')) return;

  this.sfcService.deleteSfcEntry(entry.id).subscribe(() => {
    this.entries = this.entries.filter(e => e.id !== entry.id);
    this.filteredData = this.filteredData.filter(e => e.id !== entry.id);
    this.editingIndex = null;
    this.editId = null;
    this.currentPage = this.totalPages();
    this.openDropdownIndex = null;
    this.messageService.add({
      severity: 'success',
      summary: 'Removed',
      detail: 'Entry deleted successfully.'
    });
  });
}


  // New method to toggle dropdown
toggleDropdown(i: number, event: MouseEvent) {
  this.openDropdownIndex = this.openDropdownIndex === i ? null : i;

  if (this.openDropdownIndex !== null) {
    const trigger = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const dropdown = document.querySelectorAll('.dropdown-menu')[i] as HTMLElement;

    if (dropdown) {
      dropdown.style.position = 'fixed';
      dropdown.style.top = `${trigger.bottom + 8}px`;   // 8px gap
      dropdown.style.left = `${trigger.left - 110}px`;   // shifted left by 80px
    }
  }
}


  // New method to close dropdown when clicking outside
  closeDropdown() :void {
    this.openDropdownIndex = null;
  }

  editWorkField() {
    alert('Edit Work Field button clicked!');
  }

  filteredEntries() {
    if (!this.searchTerm) return this.entries;
    const term = this.searchTerm.toLowerCase();
    return this.entries.filter(entry =>
      Object.values(entry).some(val =>
        val && val.toString().toLowerCase().includes(term)
      )
    );
  }

  paginatedEntries() {
    const filtered = this.filteredEntries();
    const start = this.startIndex;
    return filtered.slice(start, start + this.pageSize);
  }

  totalPages() {
    return Math.max(1, Math.ceil(this.filteredEntries().length / this.pageSize));
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) this.currentPage++;
  }

  toggleSelectAll() {
    const pageEntries = this.paginatedEntries();
    pageEntries.forEach(entry => entry.selected = this.selectAll);
  }

  isFieldInvalid(field: string): boolean {
    return this.submitted && (!this.newEntry[field] || this.newEntry[field].toString().trim() === '');
  }
}

// ========================================
// HTML Template Usage
// ========================================
// In your sfc-form.component.html, replace your existing date input with:

/*
<div class="date-input-container">
  <app-custom-calendar
    [selectedDate]="newEntry.date"
    [isInvalid]="isFieldInvalid('date')"
    (dateSelected)="onDateSelected($event)"
  ></app-custom-calendar>
</div>
*/

// ========================================
// SCSS Styling
// ========================================
// Add this to your sfc-form.component.scss:

/*
.date-input-container {
  width: 100%;
  margin-bottom: 1rem;
}
*/