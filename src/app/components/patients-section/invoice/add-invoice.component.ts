import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Procedure, TreatmentForm } from '../treatment-plans/treatment.interface';
import { TreatmentPlansService } from '../../../services/treatment-plans.service';
import { UserService } from '../../../services/user.service';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, forkJoin } from 'rxjs';

@Component({
  selector: 'app-add-invoice',
  templateUrl: './add-invoice.component.html',
  styleUrls: ['./add-invoice.component.scss'],
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, FormsModule, DropdownModule, CalendarModule  ]
})
export class AddInvoiceComponent implements OnInit {
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
  makePaymentList: any[] = [];
  completedTreatmentPlans: any[] = [];
  currentProcedureId: any;
  currentTreatmentPlanId: any;
  proceduresToProcess: {procedureId: any, treatmentKey: any}[] = [];

  constructor(private fb: FormBuilder, 
    private userService: UserService,
    private treatmentPlansService: TreatmentPlansService,
    private router:Router,
    private route: ActivatedRoute
  ) {
    this.initForm();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const currentState = this.router.getCurrentNavigation?.()?.extras?.state;
      if (history.state && history.state.procedures) {
        // Now procedures is an array of objects with procedureId and treatmentKey
        this.proceduresToProcess = history.state.procedures;
      }
    });
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      if(this.patientId == null) {
        this.patientId = params.get('id');
        this.treatmentPlansService.getTreatmentPlans(Number(this.patientId)).subscribe(res => {
            this.plannedTreatmentPlans = res.data.rows.filter((p: any) => p.status.toLowerCase() == 'none');
        });
        this.treatmentPlansService.getCompletedTreatmentPlans(Number(this.patientId)).subscribe(res => {
            this.completedTreatmentPlans = res.data.rows.filter((p: any) => p.status.toLowerCase() == 'completed' && p.invoice_status.toLowerCase() === 'pending' );
            // Check if we have procedures to process
            if (this.proceduresToProcess && this.proceduresToProcess.length > 0) {
              // Process each procedure in the array
              this.proceduresToProcess.forEach(proc => {
                const procedure = this.completedTreatmentPlans.find(
                  t => t.id === proc.procedureId && t.treatment_unique_id === proc.treatmentKey
                );
                if (procedure) {
                  this.addPlannedTreatment(procedure);
                }
              });
            }
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

    const index = this.treatments.length;
    this.treatments.push(treatment);
    this.setCurrentTreatment(index);
    this.calculateTotal(index);

    // Subscribe to value changes
    treatment.valueChanges.subscribe(() => {
      this.calculateTotal(index);
    });
  }

  addPlannedTreatment(procedure: any){
    const teethArray = procedure.teeth_set.split(',').map((tooth: string) => parseInt(tooth.trim(), 10));

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
          date: t.procedureDate,
          total_cost: t.total,
          total_discount: t.discount.toString(),
          notes: t.notes,
        });
      })
      this.treatmentPlansService.addInvoiceWithTreatmentPlan(treatment).subscribe(res => {
        console.log(res)
        this.router.navigate(['/patients', this.patientId, 'invoices']);
      }); 
    }
  }

  saveAndMakePayment(){
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
          date: t.procedureDate,
          total_cost: t.total,
          total_discount: t.discount.toString(),
          notes: t.notes,
        });
      });
      this.treatmentPlansService.addInvoiceWithTreatmentPlan(treatment).subscribe(res => {
        // Extract all invoice objects
        const invoices = res.data.map((item: any) => item.addedInvoice);
        
        // Create a Set of unique invoice IDs
        const uniqueInvoiceIds = new Set(invoices.map((invoice: any) => invoice.invoice_id));
        
        // Create array of payment observables only for unique invoice IDs
        const paymentObservables = Array.from(uniqueInvoiceIds).map((invoiceId: any) => {
          return this.treatmentPlansService.makePayment({
            invoice_id: invoiceId,
            amount_paid: 10,
            payment_mode: 'Cash'
          });
        });
      
        // If there are any payments to process
        if (paymentObservables.length > 0) {
          // Wait for all payment requests to complete
          forkJoin(paymentObservables).subscribe({
            next: () => {
              // Navigate only once after all payments are processed
              if (this.patientId !== null && this.patientId !== undefined) {
                this.router.navigate(['/patients', this.patientId, 'invoices']);
              }
            },
            error: (error) => {
              console.error('Error processing payments:', error);
              // Handle error case - you might still want to navigate or show an error message
            }
          });
        } else {
          // If no payments were needed, navigate anyway
          if (this.patientId !== null && this.patientId !== undefined) {
            this.router.navigate(['/patients', this.patientId, 'invoices']);
          }
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
    this.router.navigate(['/patients', this.patientId, 'invoices']);
  }
}