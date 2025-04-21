import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { UserService } from '../../../services/user.service';
import { ClinicalNotesService } from '../../../services/clinical-notes.service';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

interface Category {
  name: string;
  code: string;
}

interface SelectedItem {
  value: string;
  category: string;
}

@Component({
  selector: 'app-add-clinical-notes',
  templateUrl: './add-clinical-notes.component.html',
  styleUrls: ['./add-clinical-notes.component.scss'],
  imports: [FormsModule, CommonModule, DropdownModule, CalendarModule],
  standalone: true
})
export class AddClinicalNotesComponent implements OnInit {
  // Categories and Selection
  categories: Category[] = [];
  selectedCategory!: Category;
  
  // Form Data
  selectedComplaints: SelectedItem[] = [];
  selectedObservations: SelectedItem[] = [];
  selectedInvestigations: SelectedItem[] = [];
  selectedDiagnoses: SelectedItem[] = [];
  selectedNotes: SelectedItem[] = [];
  
  // New item inputs
  newComplaint: string = '';
  newObservation: string = '';
  newInvestigation: string = '';
  newDiagnosis: string = '';
  newNote: string = '';
  
  // Doctors
  doctors: any[] = [];
  doctor: any;
  
  // Dates
  date: Date = new Date();
  followupDate: Date = new Date();
  
  // Search and filtering
  searchText: string = '';
  addText: string = '';
  filteredItems: string[] = [];
  add: boolean = false;
  // Master data
  complaintsList: string[] = [];
  patientId: string | null | undefined;
  
  diagnosesList: string[] = [];
  observationsList: string[] = [];
  investigationsList: string[] = [];
  notesList: string[] = ['Regular checkup needed', 'Follow-up required', 'Patient reported improvement'];
  
  currentList: string[] = [];
  masterDataFetched: boolean = false;
  isEditMode: boolean = false;
  editNoteData: any = null;
  
  constructor(private userService: UserService, 
    private router: Router,
    private clinicalNotesService: ClinicalNotesService,
    private route: ActivatedRoute
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      const state = navigation.extras.state as { mode: string; noteData: any };
      if (state.mode === 'edit' && state.noteData) {
        this.isEditMode = true;
        this.editNoteData = state.noteData;
      }
    }
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      if(this.patientId == null) {
        this.patientId = params.get('id');
      }
    });
    this.initializeCategories();
    this.loadDoctors();
    this.fetchMasterData();
    if (this.isEditMode) {
      this.populateFormWithNote(this.editNoteData);
    }
  }

  populateFormWithNote(note: any) {
    // Set dates
    this.date = new Date(note.date);
    this.followupDate = note.followup_appointment ? new Date(note.followup_appointment) : new Date();

    // Set doctor
    const doctorId = note.doctor_id;
    
    // Helper to set the doctor when the doctor list is available
    const setDoctor = () => {
      if (this.doctors.length > 0) {
        this.doctor = this.doctors.find(doc => doc.user_id === doctorId) || this.doctors[0];
      }
    };
    
    // Try to set the doctor now if possible
    setDoctor();
    
    // Also set up a listener for when doctors are loaded
    const originalLoadDoctors = this.loadDoctors;
    this.loadDoctors = () => {
      originalLoadDoctors.call(this);
      // After doctors are loaded, set the correct doctor
      setDoctor();
    };

    // Clear existing arrays before populating
    this.selectedComplaints = [];
    this.selectedObservations = [];
    this.selectedInvestigations = [];
    this.selectedDiagnoses = [];
    this.selectedNotes = [];

    // Split and set the selected items
    this.parseAndSetSelectedItems(note.chief_complaints, 'COMP', this.selectedComplaints);
    this.parseAndSetSelectedItems(note.observations, 'OBS', this.selectedObservations);
    this.parseAndSetSelectedItems(note.investigations, 'INV', this.selectedInvestigations);
    this.parseAndSetSelectedItems(note.diagnoses, 'DIAG', this.selectedDiagnoses);
    this.parseAndSetSelectedItems(note.notes, 'NOTE', this.selectedNotes);
  }

  parseAndSetSelectedItems(itemsString: string, category: string, targetArray: SelectedItem[]) {
    if (itemsString && itemsString.trim()) {
      const items = itemsString.split(',');
      for (const item of items) {
        if (item.trim()) {
          targetArray.push({ value: item.trim(), category });
        }
      }
    }
  }

  fetchMasterData(){
    forkJoin({
      investigations: this.clinicalNotesService.getInvestigations(),
      complaints: this.clinicalNotesService.getComplaints(),
      diagnoses: this.clinicalNotesService.getDiagnoses(),
      observations: this.clinicalNotesService.getObservations(),
      notes: this.clinicalNotesService.getNotes(),
    }).subscribe({
        next: ({ investigations, complaints, diagnoses, observations, notes }) => {
            this.observationsList = observations.data.rows.map((obs: { name: string; }) => obs.name.trim()).filter((name: string) => name !== '');
            this.complaintsList = complaints.data.rows.map((obs: { name: string; }) => obs.name.trim()).filter((name: string) => name !== '');
            this.diagnosesList = diagnoses.data.rows.map((obs: { name: string; }) => obs.name.trim()).filter((name: string) => name !== '');
            this.investigationsList = investigations.data.rows.map((obs: { name: string; }) => obs.name.trim()).filter((name: string) => name !== '');
            this.notesList = notes.data.rows.map((obs: { name: string; }) => obs.name.trim()).filter((name: string) => name !== '');
            this.currentList = this.complaintsList;
            this.filteredItems = this.complaintsList;
            this.selectedCategory = this.categories[0];
          },
          error: (err) => {
            console.error('Error fetching data:', err);
          }
    })
  }
  private initializeCategories() {
    this.categories = [
      { name: 'Complaints', code: 'COMP' },
      { name: 'Diagnoses', code: 'DIAG' },
      { name: 'Observations', code: 'OBS' },
      { name: 'Investigations', code: 'INV' },
      { name: 'Notes', code: 'NOTE' }
    ];
    this.selectedCategory = this.categories[0];
  }

  private loadDoctors() {
    this.userService.getDoctors('bce9f008-d447-4fe2-a29e-d58d579534f0').subscribe(res => {
      this.doctors = res.data.map((doc: any) => ({
        name: `${doc.first_name} ${doc.last_name}`,
        user_id: doc.user_id
      }));
      this.doctor = this.doctors[0];
    });
  }

  hasEmptyComplaint(): boolean {
    return this.selectedComplaints.some(c => !c.value.trim());
  }

  hasEmptyObservation(): boolean {
    return this.selectedObservations.some(o => !o.value.trim());
  }

  hasEmptyInvestigation(): boolean {
    return this.selectedInvestigations.some(i => !i.value.trim());
  }

  hasEmptyDiagnosis(): boolean {
    return this.selectedDiagnoses.some(d => !d.value.trim());
  }

  hasEmptyNote(): boolean {
    return this.selectedNotes.some(n => !n.value.trim());
  }
  addItem() {
    if(!this.addText){
      return
    }
    switch (this.selectedCategory.code) {
      case 'COMP':
          this.clinicalNotesService.addComplaints(this.addText).subscribe(res =>{
            this.addText = '';
            this.fetchMasterData()
          })
        break;
      case 'OBS':
          this.clinicalNotesService.addObservations(this.addText).subscribe(res =>{
            this.fetchMasterData()
            this.addText = '';
          })
        break;
      case 'INV':
          this.clinicalNotesService.addInvestigations(this.addText).subscribe(res =>{
            this.fetchMasterData()
            this.addText = '';
          })
        break;
      case 'DIAG':
          this.clinicalNotesService.addDiagnoses(this.addText).subscribe(res => {
            this.fetchMasterData()
            this.addText = '';
          })
        break;
      case 'NOTE':
          this.clinicalNotesService.addNotes(this.addText).subscribe(res => {
            this.fetchMasterData()
            this.addText = '';
          })
        break;

    }
  }
  addEmptyItem(category: string) {
    switch (category) {
      case 'complaints':
        if (this.newComplaint) {
          this.selectedComplaints.push({ value: this.newComplaint, category: 'COMP' });
          this.newComplaint = '';
        }
        break;
      case 'observations':
        if (this.newObservation) {
          this.selectedObservations.push({ value: this.newObservation, category: 'OBS' });
          this.newObservation = '';
        }
        break;
      case 'investigations':
        if (this.newInvestigation) {
          this.selectedInvestigations.push({ value: this.newInvestigation, category: 'INV' });
          this.newInvestigation = '';
        }
        break;
      case 'diagnoses':
        if (this.newDiagnosis) {
          this.selectedDiagnoses.push({ value: this.newDiagnosis, category: 'DIAG' });
          this.newDiagnosis = '';
        }
        break;
      case 'notes':
        if (this.newNote) {
          this.selectedNotes.push({ value: this.newNote, category: 'NOTE' });
          this.newNote = '';
        }
        break;
    }
  }

  onCategoryChange(event: any) {
    switch (this.selectedCategory.code) {
      case 'COMP':
        this.currentList = this.complaintsList;
        break;
      case 'DIAG':
        this.currentList = this.diagnosesList;
        break;
      case 'OBS':
        this.currentList = this.observationsList;
        break;
      case 'INV':
        this.currentList = this.investigationsList;
        break;
      case 'NOTE':
        this.currentList = this.notesList;
        break;
    }
    this.filterItems();
  }

  filterItems() {
    if (!this.searchText) {
      this.filteredItems = this.currentList;
    } else {
      this.filteredItems = this.currentList.filter(item =>
        item.toLowerCase().includes(this.searchText.toLowerCase())
      );
    }
  }

  addSelectedItem(item: string) {
    const newItem: SelectedItem = { value: item, category: this.selectedCategory.code };
    
    switch (this.selectedCategory.code) {
      case 'COMP':
        if (!this.selectedComplaints.find(c => c.value === item)) {
          this.selectedComplaints.push(newItem);
        }
        break;
      case 'DIAG':
        if (!this.selectedDiagnoses.find(d => d.value === item)) {
          this.selectedDiagnoses.push(newItem);
        }
        break;
      case 'OBS':
        if (!this.selectedObservations.find(o => o.value === item)) {
          this.selectedObservations.push(newItem);
        }
        break;
      case 'INV':
        if (!this.selectedInvestigations.find(i => i.value === item)) {
          this.selectedInvestigations.push(newItem);
        }
        break;
      case 'NOTE':
        if (!this.selectedNotes.find(n => n.value === item)) {
          this.selectedNotes.push(newItem);
        }
        break;
    }
  }

  removeItem(category: string, index: number) {
    switch (category) {
      case 'complaints':
        this.selectedComplaints.splice(index, 1);
        break;
      case 'diagnoses':
        this.selectedDiagnoses.splice(index, 1);
        break;
      case 'observations':
        this.selectedObservations.splice(index, 1);
        break;
      case 'investigations':
        this.selectedInvestigations.splice(index, 1);
        break;
      case 'notes':
        this.selectedNotes.splice(index, 1);
        break;
    }
  }

  isItemSelected(item: string): boolean {
    switch (this.selectedCategory.code) {
      case 'COMP':
        return this.selectedComplaints.some(c => c.value === item);
      case 'DIAG':
        return this.selectedDiagnoses.some(d => d.value === item);
      case 'OBS':
        return this.selectedObservations.some(o => o.value === item);
      case 'INV':
        return this.selectedInvestigations.some(i => i.value === item);
      case 'NOTE':
        return this.selectedNotes.some(n => n.value === item);
      default:
        return false;
    }
  }
  validateNote(): { isValid: boolean; message: string } {
    // Check if all selected entries have values
    const hasEmptyComplaints = this.selectedComplaints.some(complaint => !complaint.value.trim());
    const hasEmptyObservations = this.selectedObservations.some(obs => !obs.value.trim());
    const hasEmptyInvestigations = this.selectedInvestigations.some(inv => !inv.value.trim());
    const hasEmptyDiagnoses = this.selectedDiagnoses.some(diag => !diag.value.trim());
    const hasEmptyNotes = this.selectedNotes.some(note => !note.value.trim());

    if (hasEmptyComplaints || hasEmptyObservations || hasEmptyInvestigations ||
        hasEmptyDiagnoses || hasEmptyNotes) {
      return {
        isValid: false,
        message: 'Please fill in all fields or remove empty ones'
      };
    }

    // Check if at least one item is present in any category (including new entries)
    const hasComplaints = this.selectedComplaints.length > 0 || this.newComplaint.trim().length > 0;
    const hasObservations = this.selectedObservations.length > 0 || this.newObservation.trim().length > 0;
    const hasInvestigations = this.selectedInvestigations.length > 0 || this.newInvestigation.trim().length > 0;
    const hasDiagnoses = this.selectedDiagnoses.length > 0 || this.newDiagnosis.trim().length > 0;
    const hasNotes = this.selectedNotes.length > 0 || this.newNote.trim().length > 0;

    if (!hasComplaints && !hasObservations && !hasInvestigations && !hasDiagnoses && !hasNotes) {
      return {
        isValid: false,
        message: 'Please add at least one item in any category (Complaints, Observations, Investigations, Diagnoses, or Notes)'
      };
    }

    // Check if doctor is selected
    if (!this.doctor) {
      return {
        isValid: false,
        message: 'Please select a doctor'
      };
    }

    return {
      isValid: true,
      message: ''
    };
  }
  saveNote() {
    const validation = this.validateNote();
    if (!validation.isValid) {
      return;
    }

    // Include new entries from all categories if they exist
    let allComplaints = [...this.selectedComplaints];
    if (this.newComplaint.trim()) {
      allComplaints.push({ value: this.newComplaint.trim(), category: 'COMP' });
    }

    let allObservations = [...this.selectedObservations];
    if (this.newObservation.trim()) {
      allObservations.push({ value: this.newObservation.trim(), category: 'OBS' });
    }

    let allInvestigations = [...this.selectedInvestigations];
    if (this.newInvestigation.trim()) {
      allInvestigations.push({ value: this.newInvestigation.trim(), category: 'INV' });
    }

    let allDiagnoses = [...this.selectedDiagnoses];
    if (this.newDiagnosis.trim()) {
      allDiagnoses.push({ value: this.newDiagnosis.trim(), category: 'DIAG' });
    }

    let allNotes = [...this.selectedNotes];
    if (this.newNote.trim()) {
      allNotes.push({ value: this.newNote.trim(), category: 'NOTE' });
    }

    const clinicalNote = {
      chief_complaints: allComplaints.map(item => item.value.trim()).filter(value => value !== '').toString(),
      observations: allObservations.map(item => item.value.trim()).filter(value => value !== '').toString(),
      investigations: allInvestigations.map(item => item.value.trim()).filter(value => value !== '').toString(),
      diagnoses: allDiagnoses.map(item => item.value.trim()).filter(value => value !== '').toString(),
      notes: allNotes.map(item => item.value.trim()).filter(value => value !== '').toString(),
      followup_appointment: this.followupDate,
      doctor_id: this.doctor.user_id,
      date: this.date,
      patient_id: this.patientId,
      appointment_id: 5,
    };

    if (this.isEditMode && this.editNoteData) {
      const noteToUpdate = {
        ...clinicalNote,
        id: this.editNoteData.id,
        // Preserve any other fields that might be required by the API but not in the form
        appointment_id: this.editNoteData.appointment_id || clinicalNote.appointment_id
      };
      
      this.clinicalNotesService.updateClinicalNotes(noteToUpdate).subscribe({
        next: (res) => {
          this.router.navigate(['/patients', this.patientId, 'clinical-notes']);
        },
        error: (err) => {
          console.error('Error updating clinical note:', err);
        }
      });
    } else {
      // Otherwise, use the existing saveClinicalNotes method
      this.clinicalNotesService.saveClinicalNotes(clinicalNote).subscribe({
        next: (res) => {
          this.router.navigate(['/patients', this.patientId, 'clinical-notes']);
        },
        error: (err) => {
          console.error('Error saving clinical note:', err);
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/patients', this.patientId, 'clinical-notes']);
  }
}