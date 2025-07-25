import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Procedure, TreatmentForm } from './treatment.interface';
import { TreatmentPlansService } from '../../../services/treatment-plans.service';
import { UserService } from '../../../services/user.service';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ActivatedRoute, Router } from '@angular/router';
import { format } from 'date-fns';
import { MessageService } from '../../../services/message.service';
import { PatientDataService } from '../../../services/patient-data.service';

@Component({
  selector: 'app-add-treatment-plans',
  templateUrl: './add-treatment-plans.component.html',
  styleUrls: ['./add-treatment-plans.component.scss'],
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, FormsModule, DropdownModule, CalendarModule  ]
})
export class AddTreatmentPlansComponent implements OnInit {
  treatmentForm!: FormGroup;
  currentTreatmentIndex: number | null = null;
  cost: number = 0;
  name: string = '';
  procedures: Procedure[] = [];
  add: boolean = false;
  doctors: any[] = [];
  doctor: any;
  date: Date = new Date()
  patientId: string | null | undefined;
  filteredProcedures = [...this.procedures];
  searchText: string = '';
  adulthTeeth = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
  childTeeth = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];
  isEditMode: boolean = false;
  editTreatmentData: any = null;
  uniqueCode: string | null | undefined;
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

  constructor(private fb: FormBuilder, 
    private userService: UserService,    private messageService: MessageService,
      private patientDataService: PatientDataService,

    private treatmentPlansService: TreatmentPlansService,
    private router:Router,
    private route: ActivatedRoute
  ) {
    this.initForm();
    const navigation = this.router.getCurrentNavigation();
   if (navigation?.extras.state) {
    const state = navigation.extras.state as { mode: string; treatmentData: any };
    if (state.mode === 'edit' && state.treatmentData) {
      this.isEditMode = true;
      this.editTreatmentData = state.treatmentData;
    }
  }
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      if(this.patientId == null) {
        this.patientId = params.get('id');
      }
    });
    this.route.paramMap.subscribe(params => {
      if(this.uniqueCode == null) {
        this.uniqueCode = params.get('source');
      }
    });
    this.getProcedures();
    this.userService.getDoctors('bce9f008-d447-4fe2-a29e-d58d579534f0').subscribe(res => {
      res.data.forEach((doc: { first_name: string; last_name: string; user_id: any; }) => {
        this.doctors.push({
          name: doc.first_name+" "+doc.last_name,
          user_id: doc.user_id
        });
        this.doctor = this.doctors[0];
      });
    });
    if (this.isEditMode && this.editTreatmentData) {
      this.populateFormWithTreatment(this.editTreatmentData);
    }
  }

  populateFormWithTreatment(treatmentData: any[]) {
    if (!treatmentData || treatmentData.length === 0) return;
    
    // Set the date
    if (treatmentData[0].date) {
      this.date = new Date(treatmentData[0].date);
    }
    
    // Clear the existing treatments array
    while (this.treatments.length) {
      this.treatments.removeAt(0);
    }
    
    // Add each treatment procedure to the form
    for (const treatment of treatmentData) {
      // Find the procedure in our procedures list
      let procedureMatch = this.procedures.find(p => p.id === treatment.procedure_id);
      
      // If we don't have the procedure yet (maybe procedures are still loading), create a temporary one
      if (!procedureMatch) {
        procedureMatch = {
          id: treatment.procedure_details.procedure_id,
          name: treatment.procedure_details.name,
          price: parseFloat(treatment.cost)
        };
      }
      
      // Create the treatment form group
      const treatmentFormGroup = this.fb.group({
        id: [treatment.id],
        procedureName: [treatment.procedure_details.name],
        procedureId: [treatment.procedure_details.procedure_id],
        quantity: [parseInt(treatment.quantity)],
        cost: [parseFloat(treatment.cost)],
        discount: [parseFloat(treatment.discount)],
        discountType: [treatment.discount_formate || '%'],
        total: [parseFloat(treatment.total_cost)],
        selectedTeeth: [this.parseTeethSet(treatment.teeth_set)],
        multiplyCost: [true],
        fullMouth: [false],
        showAdultTeeth: [false],
        showChildTeeth: [false],
        notes: [treatment.notes || ''],
        showNotes: [treatment.notes ? true : false]
      });
      
      this.treatments.push(treatmentFormGroup);
    }
    
    // Calculate totals
    for (let i = 0; i < this.treatments.length; i++) {
      this.calculateTotal(i);
    }
  }
  
  // Helper method to parse teeth set string to array of numbers
  parseTeethSet(teethSetString: string): number[] {
    if (!teethSetString) return [];
    
    return teethSetString.split(',')
      .map(tooth => tooth.trim())
      .filter(tooth => tooth !== '')
      .map(tooth => parseInt(tooth, 10))
      .filter(tooth => !isNaN(tooth));
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
      this.procedures = res.data.rows.map((r: any) => ({
        name: r.name,
        id: r.procedure_id,
        price: r.cost
      })).sort((a: Procedure, b: Procedure) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      
      this.filteredProcedures = [...this.procedures];
    });
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
      id: [Date.now()],
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
      showNotes: [false]
    });

    // Get the current length as the new index
  const index = this.treatments.length;
  
  // Use push instead of insert(0, ...)
  this.treatments.push(treatment);
    this.setCurrentTreatment(index);
    this.calculateTotal(index);
  }

  valuechange(treatment: any, index:number){
    this.calculateTotal(index);
  }

  toggleNotesVisibility(treatmentIndex: number): void {
    if (treatmentIndex === null || treatmentIndex >= this.treatments.length) return;
    
    const treatment = this.treatments.at(treatmentIndex);
    if (!treatment) return;
    
    const currentValue = treatment.get('showNotes')?.value;
    treatment.get('showNotes')?.setValue(!currentValue);
  }
  onFullMouthChange(treatmentIndex: number): void {
    if (treatmentIndex === null || treatmentIndex >= this.treatments.length) return;
    
    const treatment = this.treatments.at(treatmentIndex);
    if (!treatment) return;
    
    const fullMouth = treatment.get('fullMouth')?.value;
    
    if (fullMouth) {
      treatment.get('selectedTeeth')?.setValue(this.allTeethInOrder);
      // Show adult teeth by default when full mouth is checked
      treatment.get('showAdultTeeth')?.setValue(true);
    } else {
      treatment.get('selectedTeeth')?.setValue([]);
    }
    
    if(treatment.get('multiplyCost')?.value){
      treatment.get('quantity')?.setValue(treatment.get('selectedTeeth')?.value.length || 0);
    }
    
    this.calculateTotal(treatmentIndex);
  }

  toggleTeethVisibility(treatmentIndex: number, teethType: 'adult' | 'child' | 'both'): void {
    if (treatmentIndex === null || treatmentIndex >= this.treatments.length) return;
    
    const treatment = this.treatments.at(treatmentIndex);
    if (!treatment) return;

    if(teethType === 'both'){
      treatment.get('showAdultTeeth')?.setValue(false);
      treatment.get('showChildTeeth')?.setValue(false);
      treatment.get('fullMouth')?.setValue(false);
      treatment.get('selectedTeeth')?.setValue([]);
      this.calculateTotal(treatmentIndex);
    }
    else if (teethType === 'adult') {
      const currentValue = treatment.get('showAdultTeeth')?.value;
      const otherValue = treatment.get('showChildTeeth')?.value;
      
      if (currentValue && !otherValue) {
        treatment.get('showChildTeeth')?.setValue(true);
      }
      
      treatment.get('showAdultTeeth')?.setValue(!currentValue);
    } else {
      const currentValue = treatment.get('showChildTeeth')?.value;
      const otherValue = treatment.get('showAdultTeeth')?.value;
      
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

  toggleMultiplyCost(index:number){
    const treatment = this.treatments.at(index);
    const selectedTeethControl = treatment.get('selectedTeeth');

    if(treatment.get('multiplyCost')?.value){
      treatment.get('quantity')?.setValue(selectedTeethControl?.value.length)
    }

    this.calculateTotal(index);
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

  onSubmit() {
    if (this.treatmentForm.valid) {
      const procedureLists: any[] = [];
      
      // Build the treatment plan data
      const treatments = this.treatments.controls.map(control => control.value);
      
      // For edit mode, preserve original IDs and treatment_unique_id
      if (this.isEditMode && this.editTreatmentData) {
        for (let i = 0; i < treatments.length; i++) {
          const formTreatment = treatments[i];
          const originalTreatment = this.editTreatmentData.find((t: any) => 
            t.id === formTreatment.id
          );
          
          procedureLists.push({
            id: originalTreatment?.id || formTreatment.id,
            procedure_id: formTreatment.procedureId,
            quantity: formTreatment.quantity,
            cost: formTreatment.cost,
            discount: formTreatment.discount.toString(),
            discount_formate: formTreatment.discountType,
            teeth_set: formTreatment.selectedTeeth.toString(),
            status: originalTreatment?.status || "None",
            date: this.date,
            total_cost: formTreatment.total,
            total_discount: formTreatment.discount.toString(),
            notes: formTreatment.notes,
            doctor_id: this.doctor.user_id.toString(),
            treatment_unique_id: this.editTreatmentData[0].treatment_unique_id || null,
            action: "Update"
          });
        }
        
        // Submit the treatment plan update
        this.treatmentPlansService.updateTreatmentPlan({
          procedures_list: procedureLists
        }).subscribe({
          next: (res) => {
            this.updateTreatmentPlans()
          },
          error: (err) => {
            console.error('Error updating treatment plan:', err);
          }
        });
      } 
      else {
        // For new treatment plans, use the original logic
        this.treatmentForm.value.treatments.forEach((t: any) => {
          procedureLists.push({
            procedure_id: t.procedureId,
            quantity: t.quantity,
            cost: t.cost,
            discount: t.discount.toString(),
            discount_formate: t.discountType,
            teeth_set: t.selectedTeeth.toString(),
            status: "None",
            date: this.date,
            total_cost: t.total,
            total_discount: t.discount.toString(),
            notes: t.notes,
            doctor_id: this.doctor.user_id.toString(),
          });
        });
        
        procedureLists.reverse();
        
        const treatment = {
          patient_id: this.patientId,
          grand_total: this.calculateGrandTotal().toString(),
          procedures_list: procedureLists
        };
        
        this.treatmentPlansService.addTreatmentPlan(treatment).subscribe({
          next: (res) => {
            this.updateTreatmentPlans();
          },
          error: (err) => {
            console.error('Error adding treatment plan:', err);
          }
        });
      }
    }
  }

  updateTreatmentPlans(){
    if(this.patientId == null || this.patientId === undefined) return;
    this.treatmentPlansService.getTreatmentPlans(Number(this.patientId)).subscribe(res => {
  const existingData = this.patientDataService.getSnapshot();

  const updatedData = {
    ...existingData,
    treatmentPlans: res
  };

  this.patientDataService.setData(updatedData);

  // Then navigate
  this.router.navigate(['patients', this.patientId, 'treatment-plans', this.uniqueCode]);
});
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
    this.router.navigate(['/patients', this.patientId, 'treatment-plans', this.uniqueCode]);
  }
}