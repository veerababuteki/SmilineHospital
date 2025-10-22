import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Procedure, TreatmentForm } from '../treatment-plans/treatment.interface';
import { TreatmentPlansService } from '../../../services/treatment-plans.service';
import { UserService } from '../../../services/user.service';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { format } from 'date-fns';
import { MessageService } from '../../../services/message.service';
import { PatientDataService } from '../../../services/patient-data.service';
import { AppointmentComponent } from '../../appointment/appointment.component';
import { AuthService } from '../../../services/auth.service';
import { DoctorNameService } from '../../../services/doctor-name.service';
import { NormalizationService } from '../../normalization/normalization';

@Component({
  selector: 'app-add-completed-procedures',
  templateUrl: './add-completed-procedures.component.html',
  styleUrls: ['./add-completed-procedures.component.scss'],
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, FormsModule, DropdownModule, CalendarModule, AppointmentComponent  ]
})
export class AddCompletedProceduresComponent implements OnInit {
  treatmentForm!: FormGroup;
  currentTreatmentIndex: number | null = null;
  cost: number = 0;
  name: string = '';
  procedures: Procedure[] = [];
  add: boolean = false;
  uniqueCode: string | null | undefined;

  doctors: any[] = [];
  doctor: any;
  date: Date = new Date()
  patientId: string | null | undefined;
  filteredProcedures = [...this.procedures];
  searchText: string = '';
  plannedTreatmentPlans: any[] = [];
  generateInvoiceList: any[] = [];
  isLoading: boolean = false;

  allTeethInOrder = [
    // Adult upper
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
    // Adult lower
    48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
    // Child upper
    55, 54, 53, 52, 51, 61, 62, 63, 64, 65,
    // Child lower
    85, 84, 83, 82, 81, 71, 72, 73, 74, 75
  ];
  
  isEditMode: boolean = false;
  editProcedureData: any = null;
  categories: any[] = [];
  isDataLoaded: boolean = false;
  editAppointment: boolean = false;
  currentUser: any;
  patientAppointments: any[] = [];
  minDate: Date = new Date();

  constructor(private messageService: MessageService,private fb: FormBuilder, 
    private userService: UserService,
    private treatmentPlansService: TreatmentPlansService,
    private router:Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private patientDataService: PatientDataService,
    private doctorNameService: DoctorNameService,
    private normalizationService: NormalizationService
  ) {
    this.initForm();
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
    const state = navigation.extras.state as { mode: string; procedureData: any };
    if (state.mode === 'edit' && state.procedureData) {
      this.isEditMode = true;
      this.editProcedureData = state.procedureData;
    }
  }
  }

  ngOnInit() {

    this.route.parent?.paramMap.subscribe(params => {
    if(!this.patientId) {
      this.patientId = params.get('id');
      this.treatmentPlansService.getTreatmentPlans(Number(this.patientId))
        .subscribe(res => {
          this.plannedTreatmentPlans = res.data.rows.filter((p:any) => p.status.toLowerCase() === 'none');
        });
    }
  });
  this.route.paramMap.subscribe(params => {
    if(!this.uniqueCode) {
      this.uniqueCode = params.get('source');
      if(this.uniqueCode) {
        this.messageService.sendMessage(this.patientId || '', this.uniqueCode || '');
      
      }
    }
  });
  this.getProcedures();
  forkJoin({
    doctors: this.userService.getDoctors('bce9f008-d447-4fe2-a29e-d58d579534f0'),
    categories: this.userService.getCategories(),
    currentUser: this.authService.getUser()
  }).subscribe({
    next: ({ doctors, categories, currentUser }) => {
      const mapped: Array<{ name: string; user_id: any }> = doctors.data.map((doc: any) => ({
        name: `${doc.first_name} ${doc.last_name}`.trim(),
        user_id: doc.user_id
      }));
      // Format with Dr. and sort by name while preserving user_id
      const formatted: Array<{ name: string; user_id: any }> = mapped
        .map((d: { name: string; user_id: any }) => ({ ...d, name: this.doctorNameService.formatDoctorName(d.name) }))
        .sort((a: { name: string; user_id: any }, b: { name: string; user_id: any }) => a.name.localeCompare(b.name));
      this.doctors = formatted.map((d: { name: string; user_id: any }) => {
  const displayName = this.normalizationService.getDoctorDisplayName(d.name);
  return {
    name: displayName,
    user_id: d.user_id,
    label: displayName,  // ✅ Use formatted display name (e.g., "Dr. Akhila (Prostho)")
    value: d.user_id
  };
});

this.doctors = this.normalizationService.formatDoctors(this.doctors);
  this.doctors = this.normalizationService.sortDoctorsAlphabetically(this.doctors);


      this.categories = categories.data.rows.map((cat: any) => ({
        ...cat,
        label: cat.name,
        value: cat.category_id
      }));

      this.currentUser = currentUser.data;

      if(this.doctors.length) this.doctor = this.doctors[0];

      if(this.isEditMode && this.editProcedureData && this.treatments.length === 0) {
        this.populateFormWithProcedure(this.editProcedureData);
      }
    },
    error: err => {
      console.error('Error fetching appointment data:', err);
    }
  });
}
  @ViewChild('appointmentDialog', { static: false })
appointmentDialog!: AppointmentComponent;
openFollowUpAppointment() {
  if (this.appointmentDialog) {
    this.appointmentDialog.showDialog(false); // false → open in Add mode
  }
}
  
  populateFormWithProcedure(procedure: any) {
    if (!procedure) return;
    
    // Clear the existing treatments array if needed
    while (this.treatments.length) {
      this.treatments.removeAt(0);
    }
    
    // Parse teeth set to an array of numbers
    const teethArray = procedure.teeth_set !== '' 
      ? procedure.teeth_set.split(',').map((tooth: string) => parseInt(tooth.trim(), 10))
      : [];
    
    const treatment = this.fb.group({
      id: [procedure.id],
      unique_id: [procedure.treatment_unique_id],
      procedureName: [procedure.procedure_details.name],
      procedureId: [procedure.procedure_details.procedure_id || procedure.procedure_id],
      quantity: [parseInt(procedure.quantity)],
      cost: [parseFloat(procedure.cost)],
      discount: [parseFloat(procedure.discount)],
      discountType: [procedure.discount_formate || '%'],
      total: [parseFloat(procedure.total_cost)],
      selectedTeeth: [teethArray],
      multiplyCost: [true],
      fullMouth: [false],
      showAdultTeeth: [false],
      showChildTeeth: [false],
      notes: [procedure.notes || ''],
      showNotes: [!!procedure.notes],
      doctorId: [procedure.doctor_details_treat?.doctor_id || procedure.doctor_id || this.doctor?.user_id || ''],
      doctorObj: [this.doctors.find(d => d.user_id === (procedure.doctor_details_treat?.doctor_id || procedure.doctor_id)) || this.doctor || null],
      procedureDate: [procedure.date ? new Date(procedure.date) : this.date],
    });
  
    const index = this.treatments.length;
    this.treatments.push(treatment);
    this.setCurrentTreatment(index);
    this.calculateTotal(index);
  
    // Subscribe to value changes
    treatment.valueChanges.subscribe(() => {
      this.calculateTotal(index);
    });
  }

  filterProcedures() {
    const search = this.searchText.toLowerCase().trim();
    this.filteredProcedures = this.procedures.filter(procedure => 
      procedure.name.toLowerCase().includes(search) || 
      procedure.price.toString().includes(search)
    );
  }

  addProcedure(){
    if(this.name.trim()){
      this.treatmentPlansService.addProcedure(this.name, this.cost).subscribe(res => {
        this.name = '';
        this.cost = 0;
        this.add = false;
        this.procedures = [];
        this.getProcedures()
      });
    }
  }

  getProcedures(){
    this.treatmentPlansService.getProcedures().subscribe(res => {
      res.data.rows.sort((a:any, b:any) => b.procedure_id - a.procedure_id);
      res.data.rows.forEach((r: any) => {
      this.procedures.push({
        name: r.name,
        id: r.procedure_id,
        price: r.cost
      });
      this.filteredProcedures = [...this.procedures]; 
      })
    })
  }

  private initForm() {
    this.treatmentForm = this.fb.group({
      treatments: this.fb.array([])
    });
  }

  get treatments(): FormArray {
    return this.treatmentForm.get('treatments') as FormArray;
  }

  addTreatment(procedure: Procedure) {
    const treatment = this.fb.group({
      id: [],
      unique_id: [],
      procedureName: [procedure.name],
      procedureId: [procedure.id],
      quantity: [1],
      cost: [procedure.price],
      discount: [0],
      discountType: ['%'],
      total: [0],
      selectedTeeth: [[]],
      multiplyCost: [true],
      fullMouth: [false],
      showAdultTeeth: [false],
      showChildTeeth: [false],
      notes: [''],
      showNotes: [false],
      doctorId: [this.doctor?.user_id || ''],
      doctorObj: [this.doctor || null],
      procedureDate: [this.date],
    });

    // Get the current length as the new index
    const index = this.treatments.length;
  
    // Use push instead of insert(0, ...)
    this.treatments.push(treatment);
    this.setCurrentTreatment(index);
    this.calculateTotal(index);

    // Subscribe to value changes
    treatment.valueChanges.subscribe(() => {
      this.calculateTotal(index);
    });
  }

  addPlannedTreatment(procedure: any){
    const teethArray = procedure.teeth_set != '' ? procedure.teeth_set.split(',').map((tooth: string) => parseInt(tooth.trim(), 10)) : [];

    const treatment = this.fb.group({
        id: [procedure.id],
        unique_id: [procedure.treatment_unique_id],
        procedureName: [procedure.procedure_details.name],
        procedureId: [procedure.procedure_details.procedure_id],
        quantity: [procedure.quantity],
        cost: [procedure.cost],
        discount: [procedure.discount],
        discountType: [procedure.discount_formate],
        total: [procedure.total_cost],
        selectedTeeth: [teethArray],
        multiplyCost: [true],
        fullMouth: [false],
        showAdultTeeth: [false],
        showChildTeeth: [false],
        notes: [procedure.notes || ''],
        showNotes: [!!procedure.notes],
        doctorId: [procedure.doctor_details_treat.doctor_id || this.doctor?.user_id || ''],
        doctorObj: [this.doctors.find(d => d.user_id === procedure.doctor_details_treat.doctor_id) || this.doctor || null],
        procedureDate: [procedure.date ? new Date(procedure.date) : this.date],
      });
  
      const index = this.treatments.length;
      this.treatments.push(treatment);
      this.setCurrentTreatment(index);
      this.calculateTotal(index);
    
      // Subscribe to value changes
      treatment.valueChanges.subscribe(() => {
        this.calculateTotal(index);
      });
  }
  updateDoctorId(index: number, doctor: any) {
    if (index === null || index >= this.treatments.length) return;
    
    const treatment = this.treatments.at(index);
    if (!treatment) return;
    
    treatment.get('doctorId')?.setValue(doctor.user_id);
  }
  toggleNotesVisibility(treatmentIndex: number): void {
    if (treatmentIndex === null || treatmentIndex >= this.treatments.length) return;
    
    const treatment = this.treatments.at(treatmentIndex);
    if (!treatment) return;
    
    const currentValue = treatment.get('showNotes')?.value;
    treatment.get('showNotes')?.setValue(!currentValue);
  }

  toggleTeethVisibility(treatmentIndex: number, teethType: 'adult' | 'child' | 'both'): void {
    if (treatmentIndex === null || treatmentIndex >= this.treatments.length) return;
    
    const treatment = this.treatments.at(treatmentIndex);
    if (!treatment) return;
    if(teethType === 'both'){
      treatment.get('showAdultTeeth')?.setValue(false);
      treatment.get('showChildTeeth')?.setValue(false);
    }
    else if (teethType === 'adult') {
      const currentValue = treatment.get('showAdultTeeth')?.value;
      const otherValue = treatment.get('showChildTeeth')?.value;
      
      // If we're about to hide adult teeth and child teeth are also hidden,
      // then show child teeth to ensure at least one is visible
      if (currentValue && !otherValue) {
        treatment.get('showChildTeeth')?.setValue(true);
      }
      
      treatment.get('showAdultTeeth')?.setValue(!currentValue);
    } else {
      const currentValue = treatment.get('showChildTeeth')?.value;
      const otherValue = treatment.get('showAdultTeeth')?.value;
      
      // If we're about to hide child teeth and adult teeth are also hidden,
      // then show adult teeth to ensure at least one is visible
      if (currentValue && !otherValue) {
        treatment.get('showAdultTeeth')?.setValue(true);
      }
      
      treatment.get('showChildTeeth')?.setValue(!currentValue);
    }
  }
  setCurrentTreatment(index: number | null) {
    this.currentTreatmentIndex = index;
  }

  removeTreatment(index: number) {
    this.treatments.removeAt(index);
    if (this.currentTreatmentIndex === index) {
      this.currentTreatmentIndex = null;
    } else if (this.currentTreatmentIndex !== null && this.currentTreatmentIndex > index) {
      this.currentTreatmentIndex--;
    }
    this.calculateGrandTotal();
  }

  isToothSelected(treatmentIndex: number, toothNumber: number): boolean {
    if (treatmentIndex === null || treatmentIndex >= this.treatments.length) return false;
    
    const treatment = this.treatments.at(treatmentIndex);
    if (!treatment) return false;

    const selectedTeeth = treatment.get('selectedTeeth')?.value;
    return selectedTeeth ? selectedTeeth.includes(toothNumber) : false;
  }

  toggleTooth(treatmentIndex: number, toothNumber: number) {
    if (treatmentIndex === null) return;
    
    const treatment = this.treatments.at(treatmentIndex);
    if (!treatment) return;

    const selectedTeethControl = treatment.get('selectedTeeth');
    if (!selectedTeethControl) return;

    const selectedTeeth = [...selectedTeethControl.value];
    const index = selectedTeeth.indexOf(toothNumber);
    
    if (index === -1) {
      selectedTeeth.push(toothNumber);
    } else {
      selectedTeeth.splice(index, 1);
    }
    
    selectedTeethControl.setValue(selectedTeeth);
    if(treatment.get('multiplyCost')?.value){
      treatment.get('quantity')?.setValue(selectedTeeth.length)
    }
    this.calculateTotal(treatmentIndex);
  }

  calculateTotal(treatmentIndex: number) {
    const treatment = this.treatments.at(treatmentIndex);
    if (!treatment) return;

    const values = treatment.value;
    let total = values.cost * values.quantity;

    // if (values.multiplyCost && values.selectedTeeth.length > 0) {
    //   total *= values.selectedTeeth.length;
    // }

    if (values.discount > 0) {
      if (values.discountType === '%') {
        total *= (1 - values.discount / 100);
      } else {
        total -= values.discount;
      }
    }

    treatment.patchValue({ total }, { emitEvent: false });
    this.calculateGrandTotal();
  }

  valuechange(treatment: any, index: number) {
    this.calculateTotal(index);
  }

  toggleMultiplyCost(index:number){
    const treatment = this.treatments.at(index);
    const selectedTeethControl = treatment.get('selectedTeeth');

    if(treatment.get('multiplyCost')?.value){
      treatment.get('quantity')?.setValue(selectedTeethControl?.value.length)
    }

    this.calculateTotal(index);
  }

  onSubmit(){
    if(this.treatmentForm.valid){
      var procedureLists: any[] = [];
      var treatment = {
        patient_id: this.patientId,
        grand_total: this.calculateGrandTotal().toString(),
        procedures_list: procedureLists
      };
      if(this.isEditMode){
        this.treatmentForm.value.treatments.forEach((t: any)=>{
          treatment.procedures_list.push({
            procedure_id: t.procedureId,
            id: t.id,
            treatment_unique_id: t.unique_id,
            doctor_id: t.doctorId,
            quantity: t.quantity,
            cost: t.cost,
            discount: t.discount.toString(),
            discount_formate: t.discountType,
            teeth_set: t.selectedTeeth.toString(),
            status: "Completed",
            date: t.procedureDate,
            total_cost: t.total,
            total_discount: t.discount.toString(),
            notes: t.notes,
            action: this.isEditMode ? 'Update' : 'Add'
          });
        })
      }
      else{
        this.treatmentForm.value.treatments.forEach((t: any)=>{
          treatment.procedures_list.push({
            procedure_id: t.procedureId,
            treatment_plan_id: t.id,
            treatment_unique_id: t.unique_id,
            doctor_id: t.doctorId,
            quantity: t.quantity,
            cost: t.cost,
            discount: t.discount.toString(),
            discount_formate: t.discountType,
            teeth_set: t.selectedTeeth.toString(),
            status: "Completed",
            date: t.procedureDate,
            total_cost: t.total,
            total_discount: t.discount.toString(),
            notes: t.notes,
          });
        })
      }
      
      if(this.isEditMode){
        this.treatmentPlansService.updateCompletedProcedure(treatment).subscribe(res => {
          this.updateTreatmentPlans()
        }); 
      }
      else{
        this.treatmentPlansService.addCompletedProcedure(treatment).subscribe(res => {
          this.updateTreatmentPlans()
        }); 
      }
    }
  }
updateTreatmentPlans(){
    if(this.patientId == null || this.patientId === undefined) return;
    this.treatmentPlansService.getCompletedTreatmentPlans(Number(this.patientId)).subscribe(res => {
  const existingData = this.patientDataService.getSnapshot();

  const updatedData = {
    ...existingData,
    completedProcedures: res
  };

  this.patientDataService.setData(updatedData);

  this.router.navigate(['patients', this.patientId, 'completed-procedures', this.uniqueCode]);
});
  }
  saveAndGenerateInvoice(){
    if(this.treatmentForm.valid){
      var procedureLists: any[] = [];
      var treatment = {
        patient_id: this.patientId,
        grand_total: this.calculateGrandTotal().toString(),
        procedures_list: procedureLists
      };
      this.treatmentForm.value.treatments.forEach((t: any)=>{
        treatment.procedures_list.push({
          procedure_id: t.procedureId,
          treatment_plan_id: t.id,
          treatment_unique_id: t.unique_id,
          doctor_id: t.doctorId,
          quantity: t.quantity,
          cost: t.cost,
          discount: t.discount.toString(),
          discount_formate: t.discountType,
          teeth_set: t.selectedTeeth.toString(),
          status: "Completed",
          date: format(t.procedureDate,"yyyy-MM-dd"),
          total_cost: t.total,
          total_discount: t.discount.toString(),
          notes: t.notes,
        });
      })
      this.isLoading = true;
      this.treatmentPlansService.addCompletedProcedure(treatment)
  .pipe(
    catchError(error => {
      // Handle error from the addCompletedProcedure call
      console.error('Error adding completed procedure:', error);
      // Return an empty array so the chain continues but with no items
      return of({ data: [] });
    }),
    finalize(() => {
      // Reset loading state regardless of success or failure
      this.isLoading = false;
    })
  )
  .subscribe(res => {
    // Clear previous list if needed
    this.generateInvoiceList = [];
    
    // Map the data directly instead of pushing in a forEach loop
    this.generateInvoiceList = res.data.map((procedure: any) => ({
      id: procedure.id,
      treatment_unique_id: procedure.treatment_unique_id
    }));
    
    // Only proceed if we have items to process
    if (this.generateInvoiceList.length > 0) {
      this.treatmentPlansService.generateInvoice(this.generateInvoiceList)
        .pipe(
          catchError(error => {
            console.error('Error generating invoice:', error);
            // You might want to show an error message to the user here
            return of(null); // Return a value to continue the chain
          })
        )
        .subscribe(invoiceRes => {
          // Only navigate if we got a successful response
          if (invoiceRes && this.patientId) {
            this.treatmentPlansService.getInvoices(Number(this.patientId)).subscribe(res => {
  const existingData = this.patientDataService.getSnapshot();

  const updatedData = {
    ...existingData,
    invoices: res
  };

  this.patientDataService.setData(updatedData);

  this.router.navigate(['/patients', this.patientId, 'invoices', this.uniqueCode]);
});
          }
        });
    } else {
      // Handle the case when no procedures were added
      console.log('No procedures were added to generate invoices');
      // You might want to show a message to the user or navigate anyway
    }
  }); 
    }
  }

  onFullMouthChange(treatmentIndex: number): void {
    if (treatmentIndex === null || treatmentIndex >= this.treatments.length) return;
    const treatment = this.treatments.at(treatmentIndex);
    if (!treatment) return;
    const fullMouth = treatment.get('fullMouth')?.value;
    if (fullMouth) {
      treatment.get('selectedTeeth')?.setValue(this.allTeethInOrder);
      treatment.get('showAdultTeeth')?.setValue(true);
    } else {
      treatment.get('selectedTeeth')?.setValue([]);
    }
    if (treatment.get('multiplyCost')?.value) {
      treatment.get('quantity')?.setValue(treatment.get('selectedTeeth')?.value.length || 0);
    }
    this.calculateTotal(treatmentIndex);
  }
  
  calculateGrandTotal(): number {
    let totalCost = 0;
    let totalDiscount = 0;
    
    this.treatments.controls.forEach(treatment => {
      const values = treatment.value;
      let cost = values.cost * values.quantity;
      
      // if (values.multiplyCost && values.selectedTeeth.length > 0) {
      //   cost *= values.selectedTeeth.length;
      // }
      
      totalCost += cost;
      
      if (values.discount > 0) {
        if (values.discountType === '%') {
          totalDiscount += cost * (values.discount / 100);
        } else {
          totalDiscount += values.discount;
        }
      }
    });

    return totalCost - totalDiscount;
  }

  cancel(){
    this.router.navigate(['/patients', this.patientId, 'completed-procedures', this.uniqueCode]);
  }
}