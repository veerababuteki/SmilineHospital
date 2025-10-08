// Updated sfc-form.component.ts - Modified methods for row-specific actions
import { Component, Input, Output, EventEmitter, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, Validators } from '@angular/forms';
import { CustomCalendarComponent } from './custom-calendar/custom-calendar.component';
import { SfcService } from '../../../../services/sfc.service';
import { UserService } from '../../../../services/user.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'app-sfc-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomCalendarComponent, ToastModule],
  templateUrl: './sfc-form.component.html',
  styleUrl: './sfc-form.component.scss',
  providers: [MessageService]
})
export class SfcFormComponent implements OnDestroy {
  @Input() patientId: string = '';
  @Input() patientName: string = '';
  @Output() onSfcAdded = new EventEmitter<void>();

  // Patient search properties
  patientSearchResults: any[] = [];
  showPatientSearch: boolean = false;
  isSearchingPatients: boolean = false;
  isSFCFormValid: boolean = false;
  patientSearchSubject = new Subject<string>();
  patientIdFieldTitle: string = '';
  private destroy$ = new Subject<void>();

  constructor(private sfcService: SfcService, private userService: UserService, private messageService: MessageService) {
    this.setupPatientSearch();
  }
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

  //having to setup a proxy to watch for changes to recheck validity
  private newEntryProxy: any;

  setupNewEntryWatcher() {
    const handler = {
      set: (obj: any, prop: string, value: any) => {
        obj[prop] = value;
        this.isSFCFormValid = this.isFormValid();
        return true;
      }
    };
    this.newEntryProxy = new Proxy(this.newEntry, handler);
    this.newEntry = this.newEntryProxy;
  }

  // Add property to track open dropdown
  openDropdownIndex: number | null = null;

  // Anchor to scroll to the top of the form
  @ViewChild('sfcFormTop') sfcFormTop!: ElementRef<HTMLDivElement>;

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
    // Setup proxy to watch for changes
    this.setupNewEntryWatcher();
    this.newEntry.smilinePatient = 'Y'; // default value
  }

  onFormTouched() {
    this.isSFCFormValid = this.isFormValid();
  }

  setupPatientSearch() {
    this.patientSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(searchTerm => {
        if (searchTerm && searchTerm.trim().length >= 2) {
          this.isSearchingPatients = true;
          return this.userService.searchPatients(searchTerm.trim(), 10);
        } else {
          this.patientSearchResults = [];
          this.showPatientSearch = false;
          return [];
        }
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.isSearchingPatients = false;
        if (response && response.data) {
          this.patientSearchResults = response.data.map((patient: any) => ({
            id: patient.unique_code,
            userId: patient.user_id,
            age: patient.age,
            profession: patient.profession,
            name: patient.first_name + ' ' + patient.last_name,
            email: patient.email,
            phone: patient.phone,
            manual_unique_code: patient.manual_unique_code
          }));
          this.showPatientSearch = this.patientSearchResults.length > 0;
        } else {
          this.patientSearchResults = [];
          this.showPatientSearch = false;
        }
      },
      error: (error) => {
        this.isSearchingPatients = false;
        console.error('Patient search error:', error);
        this.patientSearchResults = [];
        this.showPatientSearch = false;
      }
    });
  }

  onPatientIdInput(event: any) {
    const searchTerm = event.target.value;
    if (searchTerm && searchTerm.trim().length >= 2) {
      this.patientSearchSubject.next(searchTerm);
    } else {
      this.patientSearchResults = [];
      this.showPatientSearch = false;
    }
  }

  selectPatient(patient: any) {
    this.newEntry.patientId = patient.manual_unique_code || patient.id;
    this.newEntry.name = patient.name;
    this.newEntry.ageRelation = patient.age || '';
    this.newEntry.profileOccupation = patient.profession || '';
    //Commenting out this line to prevent clearing results once patient is selected to validate the field as a valid patient.
    // this.patientSearchResults = [];
    this.showPatientSearch = false;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Handle clicking outside to close search dropdown
  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent) {
    const searchContainer = document.querySelector('.patient-search-container');
    if (searchContainer && !searchContainer.contains(event.target as Node)) {
      this.showPatientSearch = false;
    }
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

  //updated to ensure validity is rechecked on reset
  resetForm() {
    this.newEntry = new Proxy({
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
    }, {
      set: (obj: any, prop: string, value: any) => {
        obj[prop] = value;
        this.isSFCFormValid = this.isFormValid();
        return true;
      }
    });
    this.editingIndex = null;
    this.editId = null;
    this.submitted = false;
}

  // Enter edit mode for a specific entry without replacing the Proxy
  editEntry(entry: any) {
    this.editingIndex = this.entries.indexOf(entry);
    this.editId = entry.id;
    // Preserve the Proxy so that setter keeps recomputing isSFCFormValid
    Object.assign(this.newEntry, entry);
    // Recompute validity once after loading the entry
    this.isSFCFormValid = this.isFormValid();
    this.openDropdownIndex = null; // Close dropdown after action

    // Smoothly scroll to the form top when entering edit mode (after DOM updates)
    setTimeout(() => this.sfcFormTop?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  
addEntry() {
  console.log('Add entry triggered');
  this.submitted = true;

  const requiredFields = [
    this.newEntry.date,
    this.newEntry.name,
    this.newEntry.patientId,
    // this.newEntry.ageRelation,
    // this.newEntry.profileOccupation,
    // this.newEntry.smilinePatient,
    // this.newEntry.doctorFrontOfficeComment,
    // this.newEntry.doctorAdvice,
    // this.newEntry.frontOfficeRemarks
  ];

  const isEmpty = requiredFields.some(field => !field || field.toString().trim() === '');
  if (isEmpty) return;

  // Character-only validation for name
  // if (!/^[A-Za-z ]+$/.test(this.newEntry.name)) {
  //   this.messageService.add({
  //     severity: 'error',
  //     summary: 'Invalid Name',
  //     detail: 'Name should contain characters only.'
  //   });
  //   return;
  // }

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

  // this.userService.getPatient(this.newEntry.patientId).subscribe({
  //   next: (response) => {
  //     const patient = response.data?.[0];

  //     if (patient && String(this.newEntry.patientId) === String(patient.manual_unique_code)) {
  //       // Patient exists - this is good! Auto-populate name and proceed
  //       if (!this.newEntry.name || this.newEntry.name.trim() === '') {
  //         this.newEntry.name = `${patient.first_name} ${patient.last_name}`.trim();
  //       }

  //       this.messageService.add({
  //         severity: 'success',
  //         summary: 'Patient Found',
  //         detail: `Patient "${this.newEntry.name}" found. Proceeding to add SFC entry.`
  //       });
  //     }

  //     // Always proceed to add SFC entry (whether patient exists or not)
  //     this.addSfcEntry();
  //   },
  //   error: (error) => {
  //     // If patient doesn't exist (400/404), still allow adding SFC entry
  //     if (error.status === 400 || error.status === 404) {
  //       this.messageService.add({
  //         severity: 'info',
  //         summary: 'New Patient',
  //         detail: 'Patient not found in system. Adding as new SFC entry.'
  //       });
  //     } else {
  //       console.error('Unexpected error checking patient:', error);
  //     }

  //     // Always proceed to add SFC entry
  //     this.addSfcEntry();
  //   }
  // });

  this.addSfcEntry();
}

cancelEdit() {
  // Fully restore form to Add mode
  this.resetForm();                  // clears newEntry, editId, editingIndex, and validation state
  this.searchTerm = '';              // clear search field
  this.showPatientSearch = false;    // hide patient search dropdown
  this.patientSearchResults = [];    // clear any search results
  this.openDropdownIndex = null;     // ensure action dropdowns are closed
  this.submitted = false;            // reset validation error display
  // Optional user feedback
  // this.messageService.add({ severity: 'info', summary: 'Cancelled', detail: 'Edit cancelled.' });
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
  // this.userService.getPatient(entry.patientId).subscribe({
  //   next: (response) => {
  //     const patient = response.data?.[0];
  //     if (patient && String(entry.patientId) === String(patient.manual_unique_code)) {
  //       // If patient exists in backend → do not delete
  //       this.messageService.add({
  //         severity: 'warn',
  //         summary: 'Action Not Allowed',
  //         detail: 'This record belongs to an existing patient and cannot be removed.'
  //       });
  //       return;
  //     }
  //     this.confirmAndDelete(entry);
  //   },
  //   error: () => {
  //     // If getPatient fails (like 400), still allow deletion
  //     this.confirmAndDelete(entry);
  //   }
  // });
  this.confirmAndDelete(entry);
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
      dropdown.style.left = `${trigger.left - 150}px`;   // shifted left by 80px
    }
  }
}


  // New method to close dropdown when clicking outside
  closeDropdown() :void {
    this.openDropdownIndex = null;
  }

    @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const clickedInside = (event.target as HTMLElement).closest('.dropdown');
    if (!clickedInside) {
      this.closeDropdown();
    }
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
    if (field === 'patientId') {
      if (this.patientId && String(this.patientId) === String(this.newEntry.patientId)) {
        this.patientIdFieldTitle = 'Patient cannot refer themselves. Please refer other patient.';
        return true;
      }

      const otherEntries = this.entries.filter(e => e.id !== this.editId);
      const entryIds = otherEntries.map(x => String(x.patientId));
      if (entryIds.includes(String(this.newEntry.patientId))) {
        this.patientIdFieldTitle = 'This patient has already been referred.';
        return true;
      }

      return this.submitted && (!this.newEntry.patientId || this.newEntry.patientId.toString().trim() === '');
    }

    return this.submitted && (!this.newEntry[field] || this.newEntry[field].toString().trim() === '');
  }

  isFormValid(): boolean {
    const requirePatientSearch = this.editId === null; // only in add mode
    const patientIdInvalid = this.isFieldInvalid('patientId');
    const patientSearchInvalid = requirePatientSearch && (this.patientSearchResults.length === 0 && this.newEntry.patientId.trim().length >= 2);

    const formValidity = !this.isFieldInvalid('date') 
    && !this.isFieldInvalid('name') 
    && !(patientIdInvalid || patientSearchInvalid)
    && !this.isFieldInvalid('ageRelation')
    // && !this.isFieldInvalid('profileOccupation')
    // && !this.isFieldInvalid('smilinePatient')
    // && !this.isFieldInvalid('doctorFrontOfficeComment')
    // && !this.isFieldInvalid('doctorAdvice')
    // && !this.isFieldInvalid('frontOfficeRemarks');
    return formValidity;
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