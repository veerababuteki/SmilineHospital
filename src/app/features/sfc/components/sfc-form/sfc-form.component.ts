// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';

// @Component({
//   selector: 'app-sfc-form',
//   imports: [CommonModule, FormsModule],
//   templateUrl: './sfc-form.component.html',
//   styleUrl: './sfc-form.component.scss'
// })
// export class SfcFormComponent {
//   newEntry: {
//     [key: string]: string;
//     nameOpNo: string;
//     ageRelation: string;
//     profileOccupation: string;
//     smilinePatient: string;
//     doctorFrontOfficeComment: string;
//     doctorAdvice: string;
//     frontOfficeRemarks: string;
//   } = {
//     nameOpNo: '',
//     ageRelation: '',
//     profileOccupation: '',
//     smilinePatient: 'Y',
//     doctorFrontOfficeComment: '',
//     doctorAdvice: '',
//     frontOfficeRemarks: ''
//   };

//   entries: any[] = [];
//   editingIndex: number | null = null;

//   // Search and pagination
//   searchTerm: string = '';
//   currentPage: number = 1;
//   pageSize: number = 5;

//   selectAll: boolean = false;

//   submitted: boolean = false;

//   addEntry() {
//     this.submitted = true;
//     // Check for empty required fields
//     const requiredFields = [
//       this.newEntry.nameOpNo,
//       this.newEntry.ageRelation,
//       this.newEntry.profileOccupation,
//       this.newEntry.smilinePatient,
//       this.newEntry.doctorFrontOfficeComment,
//       this.newEntry.doctorAdvice,
//       this.newEntry.frontOfficeRemarks
//     ];
//     const isEmpty = requiredFields.some(field => !field || field.toString().trim() === '');
//     if (isEmpty) {
//       // Do not add, errors will show inline
//       return;
//     }
//     if (this.editingIndex !== null) {
//       // Update existing entry
//       this.entries[this.editingIndex] = { ...this.newEntry };
//       this.editingIndex = null;
//     } else {
//       // Add new entry at the top
//       this.entries.unshift({ ...this.newEntry });
//     }
//     this.newEntry = {
//       nameOpNo: '',
//       ageRelation: '',
//       profileOccupation: '',
//       smilinePatient: 'Y',
//       doctorFrontOfficeComment: '',
//       doctorAdvice: '',
//       frontOfficeRemarks: ''
//     };
//     this.currentPage = 1; // Reset to first page after add
//     this.submitted = false;
//   }

//   editEntry(entry: any) {
//     this.editingIndex = this.entries.indexOf(entry);
//     this.newEntry = { ...entry };
//   }

//   removeEntry(entry: any) {
//     this.entries = this.entries.filter(e => e !== entry);
//     if (this.editingIndex !== null && this.entries[this.editingIndex] !== entry) {
//       this.editingIndex = null;
//     }
//     // Adjust current page if needed
//     if (this.currentPage > this.totalPages()) {
//       this.currentPage = this.totalPages();
//     }
//   }

//   editWorkField() {
//     // TODO: Implement logic for editing the 'Doctors & Front Office Comment on Previous Work' field
//     alert('Edit Work Field button clicked!');
//   }

//   filteredEntries() {
//     if (!this.searchTerm) return this.entries;
//     const term = this.searchTerm.toLowerCase();
//     return this.entries.filter(entry =>
//       Object.values(entry).some(val =>
//         val && val.toString().toLowerCase().includes(term)
//       )
//     );
//   }

//   paginatedEntries() {
//     const filtered = this.filteredEntries();
//     const start = (this.currentPage - 1) * this.pageSize;
//     return filtered.slice(start, start + this.pageSize);
//   }

//   totalPages() {
//     return Math.max(1, Math.ceil(this.filteredEntries().length / this.pageSize));
//   }

//   prevPage() {
//     if (this.currentPage > 1) this.currentPage--;
//   }

//   nextPage() {
//     if (this.currentPage < this.totalPages()) this.currentPage++;
//   }

//   toggleSelectAll() {
//     const pageEntries = this.paginatedEntries();
//     pageEntries.forEach(entry => entry.selected = this.selectAll);
//   }

//   editSelectedEntry() {
//     const selected = this.entries.find(e => e.selected);
//     if (!selected) {
//       alert('Please select a row to edit.');
//       return;
//     }
//     this.editEntry(selected);
//   }

//   removeSelectedEntries() {
//     const selectedCount = this.entries.filter(e => e.selected).length;
//     if (selectedCount === 0) {
//       alert('Please select at least one row to remove.');
//       return;
//     }
//     if (!confirm('Are you sure you want to remove the selected row(s)?')) return;
//     this.entries = this.entries.filter(e => !e.selected);
//     this.selectAll = false;
//   }

//   isFieldInvalid(field: string): boolean {
//     return this.submitted && (!this.newEntry[field] || this.newEntry[field].toString().trim() === '');
//   }
// }




// Updated sfc-form.component.ts - Modified methods for row-specific actions
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomCalendarComponent } from './custom-calendar/custom-calendar.component';

@Component({
  selector: 'app-sfc-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomCalendarComponent],
  templateUrl: './sfc-form.component.html',
  styleUrl: './sfc-form.component.scss'
})
export class SfcFormComponent {
  // Your existing code remains the same...
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
  } = {
    date: '',
    name: '',
    patientId: '',
    ageRelation: '',
    profileOccupation: '',
    smilinePatient: 'Y',
    doctorFrontOfficeComment: '',
    doctorAdvice: '',
    frontOfficeRemarks: ''
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
  pageSize: number = 50;
  selectAll: boolean = false;
  submitted: boolean = false;

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

    if (this.editingIndex !== null) {
      this.entries[this.editingIndex] = { ...this.newEntry };
      this.editingIndex = null;
    } else {
      this.entries.unshift({ ...this.newEntry });
    }

    this.newEntry = {
      date: '',
      name: '',
      patientId: '',
      ageRelation: '',
      profileOccupation: '',
      smilinePatient: 'Y',
      doctorFrontOfficeComment: '',
      doctorAdvice: '',
      frontOfficeRemarks: ''
    };
    this.currentPage = 1;
    this.submitted = false;
  }

  editEntry(entry: any) {
    this.editingIndex = this.entries.indexOf(entry);
    this.newEntry = { ...entry };
    this.openDropdownIndex = null; // Close dropdown after action
  }

  removeEntry(entry: any) {
    if (!confirm('Are you sure you want to remove this entry?')) return;
    this.entries = this.entries.filter(e => e !== entry);
    if (this.editingIndex !== null && this.entries[this.editingIndex] !== entry) {
      this.editingIndex = null;
    }
    if (this.currentPage > this.totalPages()) {
      this.currentPage = this.totalPages();
    }
    this.openDropdownIndex = null; // Close dropdown after action
  }

  // New method to toggle dropdown
  toggleDropdown(index: number) {
    this.openDropdownIndex = this.openDropdownIndex === index ? null : index;
  }

  // New method to close dropdown when clicking outside
  closeDropdown() {
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