import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService as CustomMessageService } from '../../../services/message.service';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { first } from 'rxjs';
import { ClinicalNotesService } from '../../../services/clinical-notes.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

interface ConditionControls {
    [key: string]: boolean[];
  }
@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    RadioButtonModule,
    CalendarModule,
    DropdownModule,
    CheckboxModule,
    InputTextareaModule,
    FormsModule,
    ToastModule
  ],
  providers: [MessageService]
})
export class EditProfileComponent implements OnInit {
  uniqueCode: string | null | undefined;
  patientDetails: any;
  medicalHistoryForm!: FormGroup;
  groupsForm!: FormGroup;
  medicalConditions: any[] = [];
  insuranceGroups: any[] = [];
  addMedicalHistory: boolean = false;
  addGroup: boolean = false;
  addMedicalHistoryText: string = '';
  addNewGroupText: string = '';
  patientId: string | null | undefined;
  maxDate: Date;
  formValid: boolean = false;
  form: any;
  manualUniqueCode: string | null | undefined

  ngOnInit(): void {

    this.initiateForm()
    this.patientForm.statusChanges.subscribe(() => {
      this.checkFormValidity();
    });

    // Initial validity check
    this.checkFormValidity();
    this.maxDate = new Date();
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
  this.route.parent?.paramMap.subscribe(params => {
    if(this.patientId == null) {
      this.patientId = params.get('id');
    }

  });
    this.route.paramMap.subscribe(params => {
      if(this.uniqueCode == null) {
        this.uniqueCode = params.get('source');
      }
      if(this.uniqueCode){
        this.loadPatientData(this.uniqueCode)
      }

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

  loadPatientData(patientId: string){
    this.userService.getUserProfile(patientId).subscribe(res =>{
      this.patientDetails = res.data;
      this.patientForm.patchValue({
        firstName: this.patientDetails.first_name,
        customId: this.patientDetails.user_details.manual_unique_code,
        aadhaarId: this.patientDetails.aadhaar_id,
        gender: this.patientDetails.gender,
        dateOfBirth: this.patientDetails.date_of_birth !== '' ? new Date(this.patientDetails.date_of_birth) : '',
        referredBy: this.patientDetails.referred_by,
        referredByName: this.patientDetails.referred_name,
        referredByMobile: this.patientDetails.referred_mobile,
        age: this.patientDetails.age,
        bloodGroup: this.bloodGroups.find(b => b.label == this.patientDetails.blood_group),
        primaryMobile: this.patientDetails.user_details.phone,
        secondaryMobile: this.patientDetails.secondary_mobile,
        languagePreference: this.languages.find(b => b.label == this.patientDetails.langugae),
        landLine: this.patientDetails.land_line,
        email: this.patientDetails.user_details.email,
        streetAddress: this.patientDetails.street_address,
        locality: this.patientDetails.locality,
        city: this.patientDetails.city,
        pincode: this.patientDetails.pin_code,
      });
      this.manualUniqueCode=this.patientDetails.user_details.manual_unique_code
      this.userService.getMedicalHistories().subscribe(res =>{
        this.medicalConditions = res.data.rows;
        let conditionControls: ConditionControls  = {};
        this.medicalConditions.forEach(condition => {
          const his = this.patientDetails.medical_history.find((c: any) => c.id == condition.id);
          conditionControls[condition.id] =  his !== undefined ? [true] : [false];
        });

        this.medicalHistoryForm = this.fb.group({
          searchHistory: [''],
          otherHistory: [this.patientDetails.other_history],
          conditions: this.fb.group(conditionControls)
        });

        this.filteredMedicalConditions = this.medicalConditions
        this.medicalHistoryForm.get('searchHistory')?.valueChanges.subscribe(value => {
          this.filterMedicalConditions(value);
        });
      })
      this.userService.getInsuranceGroups().subscribe(res => {
        this.insuranceGroups = res.data.rows
        let conditionControls: ConditionControls  = {};

        this.insuranceGroups.forEach(condition => {
          const his = this.patientDetails.groups.find((c: any) => c.id == condition.id);
          conditionControls[condition.id] = his !== undefined ? [true] : [false];
        });

        this.groupsForm  = this.fb.group({
          groups: this.fb.group(conditionControls)
        });
      })
    })
  }
  patientForm!: FormGroup;

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
    {label: 'Male', value: 'Male'},
    {label: 'Female', value: 'Female'},
  ];
  referredBy: any[] = [
    {label: 'Friend', value: 'Friend'},
    {label: 'Family', value: 'Family'},
    {label: 'Online', value: 'Online'},
    {label: 'Other', value: 'Other'}
  ];
  languages: any[] = [
    { label: 'English (Practice Default)', value: 'english' },
    { label: 'English', value: 'english' },
    { label: 'Hindi', value: 'hindi' },
    { label: 'Telugu', value: 'telugu' },
    { label: 'Marathi', value: 'marathi' },
    { label: 'Gujarati', value: 'gujarati' },
    { label: 'Tamil', value: 'tamil' },
    { label: 'Malayalam', value: 'malayalam' },
    { label: 'Bengali', value: 'bengali' },
    { label: 'Punjabi', value: 'punjabi' },
    { label: 'Kannada', value: 'kannada' },
    { label: 'Assamese', value: 'assamese' },
    { label: 'Odia', value: 'odia' },
  ];

  getControlName(condition: string): string {
    return condition.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  constructor(
    private fb: FormBuilder,
    private customMessageService: CustomMessageService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private userService: UserService,
    private clinicalNotesService: ClinicalNotesService,
    private router: Router
  ) {
    this.maxDate = new Date();
  }
  initiateForm(){
    this.patientForm = this.fb.group({
       firstName: ['',
        Validators.pattern('^[a-zA-Z ]+$')],
      customId: ['', Validators.required],
      // aadhaarId: [''],
       aadhaarId: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]{12}$/) // Only 12 digits
        ]
      ],
      gender: ['', Validators.required],
      dateOfBirth: [''],
      age: [''],
      referredBy: [''],
      referredByName: [''],
      referredByMobile: ['',
        Validators.pattern('^[1-9]\\d{9}$')],
      bloodGroup: [null],
      primaryMobile: ['', Validators.required],
      secondaryMobile: ['',
        Validators.pattern('^[1-9]\\d{9}$')],
      languagePreference: ['english'],
      landLine: [''],
      email: ['', Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')],
      streetAddress: [''],
      locality: [''],
      city: [''],
      pincode: [''],
    });
    
  }
  
  get aadhaarId() {
    return this.form.get('aadhaarId');
  }
  filteredMedicalConditions: any[] = [];
  searchText: string = '';
  filterMedicalConditions(searchText: string) {
    this.searchText = searchText.toLowerCase();
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

    const previousId = (this.manualUniqueCode || '').toString().trim();
    const currentId = (patientDetails.customId || '').toString().trim();

    if (previousId !== currentId) {
      this.userService.getProfileByManualUniqueCode(currentId).subscribe({
        next: (existingUser) => {
          if (existingUser && existingUser.data) {
            this.messageService.add({
              severity: 'error',
              summary: 'Duplicate ID',
              detail: `Please enter a unique ID. A patient already exists with the ID: ${currentId}`
            });
            return;
          }
          this.updatePatientProfile(patientDetails, historyDetails);
        },
        error: () => {

          this.updatePatientProfile(patientDetails, historyDetails);
        }
      });
    } else {
      this.updatePatientProfile(patientDetails, historyDetails);
    }
  } else {
    this.messageService.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please fill all required fields'
    });
    this.markFormGroupTouched(this.patientForm);
  }
}


private updatePatientProfile(patientDetails: any, historyDetails: any) {
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

  this.userService.updateUserProfile({
    id: this.patientDetails.id,
    first_name: patientDetails.firstName,
    manual_unique_code: patientDetails.customId,
    date_of_birth: patientDetails.dateOfBirth,
    address: patientDetails.streetAddress,
    aadhaar_id: patientDetails.aadhaarId,
    abhi_id: null,
    age: patientDetails.age,
    anniversary: null,
    referred_by: patientDetails.referredBy,
    referred_name: patientDetails.referredByName,
    referred_mobile: patientDetails.referredByMobile,
    blood_group: patientDetails.bloodGroup !== null && patientDetails.bloodGroup !== undefined
      ? patientDetails.bloodGroup.label
      : '',
    family: null,
    gender: patientDetails.gender,
    secondary_mobile: patientDetails.secondaryMobile,
    land_line: patientDetails.landLine,
    street_address: patientDetails.streetAddress,
    locality: patientDetails.locality,
    city: patientDetails.city,
    pin_code: patientDetails.pincode,
    profile: null,
    user_id: this.patientDetails.user_id,
    medical_history: selectedConditions,
    groups_list: selectedGroups,
    other_history: historyDetails.otherHistory,
  }).subscribe({
    next: () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Patient profile updated successfully'
      });
      setTimeout(() => {
        this.router.navigate(['patients', this.patientDetails.user_id, 'profile', this.uniqueCode]);
      }, 1000);
    },
    error: () => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update patient profile'
      });
    }
  });
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
  addNewMedicalHistory(){
    if(this.addMedicalHistoryText.trim()){
      this.clinicalNotesService.addMedicalHistory(this.addMedicalHistoryText.trim()).subscribe(res =>{
        this.userService.getMedicalHistories().subscribe(res =>{
          this.addMedicalHistoryText = '';
          this.medicalConditions = res.data.rows;
          let conditionControls: ConditionControls  = {};
          this.medicalConditions.forEach(condition => {
            const his = this.patientDetails.medical_history.find((c: any) => c.id == condition.id);
            conditionControls[condition.id] =  his !== undefined ? [true] : [false];
          });

          this.medicalHistoryForm = this.fb.group({
            searchHistory: [''],
            otherHistory: [this.patientDetails.other_history],
            conditions: this.fb.group(conditionControls)
          });

          this.filteredMedicalConditions = this.medicalConditions
          this.medicalHistoryForm.get('searchHistory')?.valueChanges.subscribe(value => {
            this.filterMedicalConditions(value);
          });
        })
      })
    }
  }
  addNewGroup(){
    this.clinicalNotesService.addGroup(this.addNewGroupText).subscribe(res=>{
      this.userService.getInsuranceGroups().subscribe(res => {
        this.addNewGroupText = ''
        this.insuranceGroups = res.data.rows
        let conditionControls: ConditionControls  = {};

        this.insuranceGroups.forEach(condition => {
          const his = this.patientDetails.groups.find((c: any) => c.id == condition.id);
          conditionControls[condition.id] = his !== undefined ? [true] : [false];
        });

        this.groupsForm  = this.fb.group({
          groups: this.fb.group(conditionControls)
        });
      })
    })
  }
  cancel(){
    this.router.navigate(['patients', this.patientDetails.user_id, 'profile', this.uniqueCode])
  }
}
