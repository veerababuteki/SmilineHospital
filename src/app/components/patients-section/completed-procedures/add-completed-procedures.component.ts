import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Procedure, TreatmentForm } from '../treatment-plans/treatment.interface';
import { TreatmentPlansService } from '../../../services/treatment-plans.service';
import { UserService } from '../../../services/user.service';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { format } from 'date-fns';

@Component({
  selector: 'app-add-completed-procedures',
  templateUrl: './add-completed-procedures.component.html',
  styleUrls: ['./add-completed-procedures.component.scss'],
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, FormsModule, DropdownModule, CalendarModule  ]
})
export class AddCompletedProceduresComponent implements OnInit {
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
  plannedTreatmentPlans: any[] = [];
  generateInvoiceList: any[] = [];
  isLoading: boolean = false;

  constructor(private fb: FormBuilder, 
    private userService: UserService,
    private treatmentPlansService: TreatmentPlansService,
    private router:Router,
    private route: ActivatedRoute
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      if(this.patientId == null) {
        this.patientId = params.get('id');
        this.treatmentPlansService.getTreatmentPlans(Number(this.patientId)).subscribe(res => {
            this.plannedTreatmentPlans = res.data.rows.filter((p: any) => p.status.toLowerCase() == 'none');
        });
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

    const index = 0;
    this.treatments.insert(index,treatment);
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
    this.calculateTotal(treatmentIndex);
  }

  calculateTotal(treatmentIndex: number) {
    const treatment = this.treatments.at(treatmentIndex);
    if (!treatment) return;

    const values = treatment.value;
    let total = values.cost * values.quantity;

    if (values.multiplyCost && values.selectedTeeth.length > 0) {
      total *= values.selectedTeeth.length;
    }

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

  onSubmit(){
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
      this.treatmentPlansService.addCompletedProcedure(treatment).subscribe(res => {
        console.log(res)
        this.router.navigate(['/patients', this.patientId, 'completed-procedures']);
      }); 
    }
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
            this.router.navigate(['/patients', this.patientId, 'completed-procedures']);
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
  calculateGrandTotal(): number {
    let totalCost = 0;
    let totalDiscount = 0;
    
    this.treatments.controls.forEach(treatment => {
      const values = treatment.value;
      let cost = values.cost * values.quantity;
      
      if (values.multiplyCost && values.selectedTeeth.length > 0) {
        cost *= values.selectedTeeth.length;
      }
      
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
    this.router.navigate(['/patients', this.patientId, 'completed-procedures']);
  }
}