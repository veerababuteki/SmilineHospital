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
import { SfcService } from '../../../../services/sfc.service';

@Component({
  selector: 'app-sfc-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomCalendarComponent],
  templateUrl: './sfc-form.component.html',
  styleUrl: './sfc-form.component.scss'
})
export class SfcFormComponent {

  constructor(private sfcService: SfcService) {}
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
    frontOfficeRemarks: ''
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

  if (this.editId) {
    this.sfcService.updateSfcEntry(this.editId, this.newEntry).subscribe({
      next: (response) => {
        console.log('Entry updated successfully:', response);

        const updatedEntry = { id: this.editId, ...this.newEntry };

        // Update in main entries
        if (this.editingIndex !== null) {
          this.entries[this.editingIndex] = updatedEntry;
        } else {
          const index = this.entries.findIndex(e => e.id === this.editId);
          if (index !== -1) this.entries[index] = updatedEntry;
        }

        // Also update in filteredData (in case it's showing a filtered view)
        const filteredIndex = this.filteredData.findIndex(e => e.id === this.editId);
        if (filteredIndex !== -1) {
          this.filteredData[filteredIndex] = updatedEntry;
        }

        this.resetForm();
      },
      error: (error) => {
        console.error('Failed to update entry:', error);
      }
    });
    return;
  }

  this.sfcService.addSfcEntry(this.newEntry).subscribe({
    next: (response) => {
      console.log('Entry added successfully:', response);

      const newRecord = { id: response.id || Date.now(), ...this.newEntry };
      this.entries.unshift(newRecord);
      this.filteredData = [...this.entries]; // Sync filtered data

      this.resetForm();
      this.currentPage = 1;
    },
    error: (error) => {
      console.error('Failed to add entry:', error);
    }
  });
}


 removeEntry(entry: any) {
  if (!confirm('Are you sure you want to remove this entry?')) return;

  this.sfcService.deleteSfcEntry(entry.id).subscribe({
    next: () => {
      // Remove entry from main list
      this.entries = this.entries.filter(e => e.id !== entry.id);

      // Also remove from filteredData
      this.filteredData = this.filteredData.filter(e => e.id !== entry.id);

      // Reset editing index if needed
      if (this.editingIndex !== null && this.entries[this.editingIndex]?.id === entry.id) {
        this.editingIndex = null;
        this.editId = null;
      }

      // Adjust pagination
      if (this.currentPage > this.totalPages()) {
        this.currentPage = this.totalPages();
      }

      // Close any open dropdown
      this.openDropdownIndex = null;
    },
    error: (error) => {
      console.error('Failed to delete entry:', error);
      alert('Failed to delete entry. Please try again.');
    }
  });
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