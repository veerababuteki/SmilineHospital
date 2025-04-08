import { Component, OnInit } from '@angular/core';
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
import { ClinicalNotesService } from '../../../services/clinical-notes.service';
interface ConditionControls {
    [key: string]: boolean[];
  }
@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule,
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
  ngOnInit(): void {
    
    this.initiateForm()
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
    this.route.paramMap.subscribe(params => {
      if(this.uniqueCode == null) {
        this.uniqueCode = params.get('source');
      }
      if(this.uniqueCode){
        this.loadPatientData(this.uniqueCode)
      }
      
    });
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
        pincode: this.patientDetails.pin_code
      });
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
  refferedBy: any[] = [
    {label: 'Friend', value: 'Friend'},
    {label: 'Family', value: 'Family'},
    {label: 'Online', value: 'Online'},
    {label: 'Other', value: 'Other'}
  ];
  languages: any[] = [
    { label: 'English (Practice Default)', value: 'english' }
  ];
  getControlName(condition: string): string {
    return condition.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  constructor(private fb: FormBuilder, private messageService: MessageService, 
    private route: ActivatedRoute, private userService: UserService, private clinicalNotesService: ClinicalNotesService,
    private router: Router
  ) {
  }
  initiateForm(){
    this.patientForm = this.fb.group({
      firstName: ['', Validators.required],
      customId: [''],
      aadhaarId: [''],
      gender: ['', Validators.required],
      dateOfBirth: [''],
      age: [''],
      referredBy: [''],
      refferedByName: [''],
      refferedByMobile: [''],
      bloodGroup: [null],
      primaryMobile: ['', Validators.required],
      secondaryMobile: [''],
      languagePreference: ['english'],
      landLine: [''],
      email: [''],
      streetAddress: [''],
      locality: [''],
      city: [''],
      pincode: ['']
    });
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
      let selectedConditions: string[] = [];
      let selectedGroups: string[] = [];
      if(this.medicalHistoryForm.valid){
        selectedConditions = Object.keys(this.medicalHistoryForm.value.conditions)
            .filter(id => this.medicalHistoryForm.value.conditions[id]);
      }
      if(this.groupsForm.valid){
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
        referred_name: patientDetails.refferedByName,
        referred_mobile: patientDetails.refferedByMobile,
        blood_group: patientDetails.bloodGroup !== null && patientDetails.bloodGroup !== undefined ? patientDetails.bloodGroup.label: '',
        family: null,
        gender: patientDetails.gender,
        secondary_mobile: patientDetails.primaryMobile,
        langugae: patientDetails.languagePreference.label,
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
      }).subscribe(res=>{
        this.router.navigate(['patients', this.patientDetails.user_id, 'profile', this.uniqueCode])
      })
    }
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