import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from '../../../services/message.service';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { first } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ClinicalNotesService } from '../../../services/clinical-notes.service';

interface ConditionControls {
  [key: string]: boolean[];
}

@Component({
  selector: 'app-add-profile',
  templateUrl: './add-profile.component.html',
  styleUrls: ['./add-profile.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    RadioButtonModule,
    CalendarModule,
    DropdownModule,
    CheckboxModule,
    InputTextareaModule,
    FormsModule
  ]
})
export class AddProfileComponent implements OnInit {
  uniqueCode: string | null | undefined;
  patientDetails: any = { medical_history: [], groups: [], other_history: '' }; // Initialize with default values

  @Output() onSave = new EventEmitter<any>();
  @Output() onCancel = new EventEmitter<void>();

  addMedicalHistory: boolean = false;
  addGroup: boolean = false;
  addMedicalHistoryText: string = '';
  addNewGroupText: string = '';
  maxDate: Date;
  form!: FormGroup;

  // Initialize forms early
  patientForm: FormGroup;
  medicalHistoryForm: FormGroup;
  groupsForm: FormGroup;

  medicalConditions: any[] = [];
  insuranceGroups: any[] = [];
  filteredMedicalConditions: any[] = [];
  searchText: string = '';
  //  form: any;
  formValid: boolean = false;
  bloodGroups: any[] = [
    { label: 'Select Blood Group', value: null },
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' }
  ];

  relations: any[] = [
    { label: 'Relation', value: null },
    { label: 'Father', value: 'father' },
    { label: 'Mother', value: 'mother' },
    { label: 'Spouse', value: 'spouse' },
    { label: 'Child', value: 'child' }
  ];

  genders: any[] = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
  ];

  refferedBy: any[] = [
    { label: 'Friend', value: 'Friend' },
    { label: 'Family', value: 'Family' },
    { label: 'Online', value: 'Online' },
    { label: 'Other', value: 'Other' }
  ];

  languages: any[] = [
    { label: 'English (Practice Default)', value: 'english' }
  ];

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private clinicalNotesService: ClinicalNotesService
  ) {
    // Initialize forms in constructor to ensure they exist before template renders
    this.patientForm = this.createPatientForm();
    this.patientForm.statusChanges.subscribe(() => {
      this.checkFormValidity();
    });

    // Initial validity check
    this.checkFormValidity();
    this.maxDate = new Date();
    // Initialize with empty groups for now, will be updated in ngOnInit
    this.medicalHistoryForm = this.fb.group({
      searchHistory: [''],
      otherHistory: [''],
      conditions: this.fb.group({})
    });

    this.groupsForm = this.fb.group({
      groups: this.fb.group({})
    });
  }


   
  checkFormValidity(): void {
    // Check if patient form is valid (which includes all required fields)
    this.formValid = this.patientForm.valid;

    // You can add additional custom validation logic here if needed
    // For example, checking if at least one medical condition is selected

    // Optional: Display validation errors or messages
    if (!this.formValid && this.patientForm.touched) {
      this.highlightInvalidFields();
    }
  }

  // Helper method to identify and highlight invalid fields (optional)
  highlightInvalidFields(): void {
    const controls = this.patientForm.controls;

    for (const name in controls) {
      if (controls[name].invalid) {
        // You could use this to show specific error messages or highlight fields
        // console.log(`Field ${name} is invalid`);
      }
    }
  }
  ngOnInit(): void {
    // Load medical histories
    this.userService.getMedicalHistories().subscribe(res => {
      this.medicalConditions = res.data.rows;
      this.updateMedicalHistoryForm();
    });
    const dateOfBirthControl = this.patientForm.get('dateOfBirth');
    const ageControl = this.patientForm.get('age');

    if (dateOfBirthControl && ageControl) {
      dateOfBirthControl.valueChanges.subscribe(date => {
        if (date) {
          const age = this.calculateAge(date);
          ageControl.setValue(age, { emitEvent: false });
        } else {
          ageControl.setValue('', { emitEvent: false });
        }
      });
    }

    // Load insurance groups
    this.userService.getInsuranceGroups().subscribe(res => {
      this.insuranceGroups = res.data.rows;
      this.updateGroupsForm();
    });
  }

  // Helper method to create patient form
  private createPatientForm(): FormGroup {
    return this.fb.group({
      firstName: ['', Validators.required],
      customId: ['', Validators.required],
      aadhaarId: ['', Validators.pattern('^[1-9]\\d{11}$')],
      gender: ['', Validators.required],
      dateOfBirth: [''],
      age: [''],
      referredBy: [''],
      refferedByName: [''],
      refferedByMobile: ['',
        Validators.pattern('^[1-9]\\d{9}$')],
      bloodGroup: [null],
      primaryMobile: ['', [
        Validators.required,
        Validators.pattern('^[1-9]\\d{9}$'), // Starts with 6-9 and has 10 digits
      ]],
      // email: [''],
       email: ['', Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')],
      secondaryMobile: ['',
        Validators.pattern('^[1-9]\\d{9}$')],
      languagePreference: [this.languages[0]],  // Default to first option
      landLine: [''],
      streetAddress: [''],
      locality: [''],
      city: [''],
    pincode: ['',
        Validators.pattern('^[1-9]\\d{6}$')],
    });
  }

  // Update medical history form whenever conditions change
  private updateMedicalHistoryForm(): void {
    const conditionControls: ConditionControls = {};

    this.medicalConditions.forEach(condition => {
      // Find if this condition is in patient's history
      const his = this.patientDetails?.medical_history?.find((c: any) => c.id === condition.id);
      conditionControls[condition.id] = his !== undefined ? [true] : [false];
    });

    // Create a new form group
    this.medicalHistoryForm = this.fb.group({
      searchHistory: [''],
      otherHistory: [this.patientDetails?.other_history || ''],
      conditions: this.fb.group(conditionControls)
    });

    this.filteredMedicalConditions = [...this.medicalConditions];

    // Set up search filter
    this.medicalHistoryForm.get('searchHistory')?.valueChanges.subscribe(value => {
      this.filterMedicalConditions(value);
    });
  }

  // Update groups form whenever insurance groups change
  private updateGroupsForm(): void {
    const groupControls: ConditionControls = {};

    this.insuranceGroups.forEach(group => {
      const his = this.patientDetails?.groups?.find((c: any) => c.id === group.id);
      groupControls[group.id] = his !== undefined ? [true] : [false];
    });

    this.groupsForm = this.fb.group({
      groups: this.fb.group(groupControls)
    });
  }

  getControlName(condition: string): string {
    return condition.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  filterMedicalConditions(searchText: string) {
    this.searchText = searchText ? searchText.toLowerCase() : '';

    if (!this.searchText) {
      this.filteredMedicalConditions = [...this.medicalConditions];
    } else {
      this.filteredMedicalConditions = this.medicalConditions.filter(condition =>
        condition.name.toLowerCase().includes(this.searchText)
      );
    }
  }

  onSubmit() {
    if (this.patientForm.valid) {
      const patientDetails = this.patientForm.value;
      const historyDetails = this.medicalHistoryForm.value;

      let selectedConditions: string[] = [];
      let selectedGroups: string[] = [];

      if (this.medicalHistoryForm.valid) {
        selectedConditions = Object.keys(this.medicalHistoryForm.value.conditions)
          .filter(id => this.medicalHistoryForm.value.conditions[id]);
      }

      if (this.groupsForm.valid) {
        selectedGroups = Object.keys(this.groupsForm.value.groups)
          .filter(id => this.groupsForm.value.groups[id]);
      }

      this.authService.registerUser({
        first_name: patientDetails.firstName,
        manual_unique_code: patientDetails.customId,
        date_of_birth: patientDetails.dateOfBirth,
        address: patientDetails.streetAddress,
        aadhaar_id: patientDetails.aadhaarId,
        abhi_id: null,
        age: patientDetails.age,
        anniversary: null,
        referred_by: patientDetails.referredBy,
        referred_name: patientDetails.refferedByName,
        referred_mobile: patientDetails.refferedByMobile,
        blood_group: patientDetails.bloodGroup !== null ? patientDetails.bloodGroup.label : '',
        email: patientDetails.email,
        family: null,
        gender: patientDetails.gender,
        phone: patientDetails.primaryMobile,
        secondary_mobile: patientDetails.secondaryMobile,
        langugae: patientDetails.languagePreference.label,
        land_line: patientDetails.landLine,
        street_address: patientDetails.streetAddress,
        locality: patientDetails.locality,
        city: patientDetails.city,
        pin_code: patientDetails.pincode,
        medical_history: selectedConditions,
        groups_list: selectedGroups,
        other_history: historyDetails.otherHistory,
        profile: null,
      }).subscribe(res => {

        this.patientForm.reset();
        this.medicalHistoryForm.reset();
        this.groupsForm.reset();
        this.userService.sendLoadPatients();
        this.onSave.emit({ user_id: res.data.user.user_id, unique_code: res.data.user.unique_code });
      });
    } else {
      this.markFormGroupTouched(this.patientForm);
    }
    setTimeout(function () {
      window.location.reload();
    }, 1500);
  }
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      // If control is a nested form group, mark its controls too
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  addNewMedicalHistory() {
    if (this.addMedicalHistoryText.trim()) {
      this.clinicalNotesService.addMedicalHistory(this.addMedicalHistoryText.trim()).subscribe(res => {
        this.addMedicalHistoryText = '';
        // Refresh medical histories
        this.userService.getMedicalHistories().subscribe(res => {
          this.medicalConditions = res.data.rows;
          this.updateMedicalHistoryForm();
        });
      });
    }
  }

  addNewGroup() {
    if (this.addNewGroupText.trim()) {
      this.clinicalNotesService.addGroup(this.addNewGroupText).subscribe(res => {
        this.addNewGroupText = '';
        // Refresh groups
        this.userService.getInsuranceGroups().subscribe(res => {
          this.insuranceGroups = res.data.rows;
          this.updateGroupsForm();
        });
      });
    }
  }
  calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
  cancel() {
    this.onCancel.emit();
  }
}
