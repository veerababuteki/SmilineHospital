import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Procedure, TreatmentForm } from '../treatment-plans/treatment.interface';
import { TreatmentPlansService } from '../../../services/treatment-plans.service';
import { UserService } from '../../../services/user.service';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, forkJoin } from 'rxjs';
import { MessageService } from '../../../services/message.service';
import { PatientDataService } from '../../../services/patient-data.service';
import { MessageService as Toaster } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DoctorNameService } from '../../../services/doctor-name.service';
import { NormalizationService } from '../../normalization/normalization';

@Component({
  selector: 'app-add-invoice',
  templateUrl: './add-invoice.component.html',
  styleUrls: ['./add-invoice.component.scss'],
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, FormsModule, DropdownModule, CalendarModule, ToastModule  ],
  providers: [Toaster]
})
export class AddInvoiceComponent implements OnInit {
  treatmentForm!: FormGroup;
  currentTreatmentIndex: number | null = null;
  cost: number = 0;
  name: string = '';
  procedures: Procedure[] = [];
  add: boolean = false;
  doctors: any[] = [];
  doctor: any = null;
  date: Date = new Date();
  patientId: string | null | undefined;
  filteredProcedures = [...this.procedures];
  searchText: string = '';
  plannedTreatmentPlans: any[] = [];
  makePaymentList: any[] = [];
  completedTreatmentPlans: any[] = [];
  currentProcedureId: any;
  currentTreatmentPlanId: any;
  proceduresToProcess: {procedureId: any, treatmentKey: any}[] = [];
  isEditMode: boolean = false;
  editInvoiceData: any[] = [];
  editInvoiceKey: string | null = null;
  uniqueCode: string | null | undefined;
  doctorsLoaded: boolean = false;
  selectedInvoiceList: any[] = [];

  constructor(
    private fb: FormBuilder, 
    private userService: UserService,              
    private messageService: MessageService,
    private patientDataService: PatientDataService,
    private treatmentPlansService: TreatmentPlansService,
    private router: Router,
    private route: ActivatedRoute,
    private toaster: Toaster,
    private doctorNameService: DoctorNameService,
    private normalizationService: NormalizationService
  ) {
    this.initForm();
    
    // Handle navigation state
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (history.state && history.state.mode === 'edit' && history.state.invoiceData) {
        this.isEditMode = true;
        this.editInvoiceData = history.state.invoiceData;
        this.editInvoiceKey = history.state.invoiceKey;
      }
      if (history.state && history.state.procedures) {
        this.proceduresToProcess = history.state.procedures;
      }
    });
  }

  ngOnInit() {
    // Load doctors first
    this.loadDoctors().then(() => {
      // After doctors are loaded, handle route parameters
      this.handleRouteParameters();
    });
    
    // Load procedures
    this.getProcedures();
  }

  private async loadDoctors(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userService.getDoctors('bce9f008-d447-4fe2-a29e-d58d579534f0').subscribe({
        next: (res) => {
          // Map to objects with name and id
          const mapped = res.data.map((doc: { first_name: string; last_name: string; user_id: any; }) => ({
            name: `${doc.first_name} ${doc.last_name}`.trim(),
            user_id: doc.user_id
          }));
          // Format with Dr. and sort by name
this.doctors = mapped
  .map((d: { name: string; user_id: any }) => ({
    ...d,
    name: this.normalizationService.getDoctorDisplayName(d.name) // ✅ use getDoctorDisplayName here
  }))
  .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));

  this.doctors = this.normalizationService.formatDoctors(this.doctors);
  this.doctors = this.normalizationService.sortDoctorsAlphabetically(this.doctors);

          // Set default doctor
          if (this.doctors.length > 0) {
            this.doctor = this.doctors[0];
          }
          
          this.doctorsLoaded = true;
          resolve();
        },
        error: (error) => {
          console.error('Error loading doctors:', error);
          this.doctorsLoaded = true;
          reject(error);
        }
      });
    });
  }

  private handleRouteParameters() {
    // Handle parent route parameters (patient ID)
    this.route.parent?.paramMap.subscribe(params => {
      if (this.patientId == null) {
        this.patientId = params.get('id');
        this.loadTreatmentPlans();
      }
    });

    // Handle route parameters (unique code)
    this.route.paramMap.subscribe(params => {
      if (this.uniqueCode == null) {
        this.uniqueCode = params.get('source');
      }
    });
  }

  private loadTreatmentPlans() {
    if (!this.patientId) return;

    // Load planned treatment plans
    this.treatmentPlansService.getTreatmentPlans(Number(this.patientId)).subscribe(res => {
      this.plannedTreatmentPlans = res.data.rows.filter((p: any) => p.status.toLowerCase() == 'none');
    });

    // Load completed treatment plans
    this.treatmentPlansService.getCompletedTreatmentPlans(Number(this.patientId)).subscribe(res => {
      this.completedTreatmentPlans = res.data.rows.filter((p: any) => 
        p.status.toLowerCase() == 'completed' && p.invoice_status.toLowerCase() === 'pending'
      );
      
      // Handle edit mode after doctors and treatment plans are loaded
      if (this.isEditMode && this.editInvoiceData && this.doctorsLoaded) {
        this.populateFormWithInvoice(this.editInvoiceData);
      }
      
      // Process procedures if any
      if (this.proceduresToProcess && this.proceduresToProcess.length > 0) {
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
  
  populateFormWithInvoice(invoiceData: any[]) {
    if (!invoiceData || invoiceData.length === 0 || !this.doctorsLoaded) return;
    
    // Clear the existing treatments array
    while (this.treatments.length) {
      this.treatments.removeAt(0);
    }
    
    // Add each treatment from the invoice to the form
    for (const item of invoiceData) {
      const treatment = item.treatment_plans;
      
      // Parse teeth set to an array of numbers
      const teethArray = treatment.teeth_set 
        ? treatment.teeth_set.split(',').map((tooth: string) => parseInt(tooth.trim(), 10))
        : [];
      
      // Find the correct doctor object from the doctors array
      const doctorId = treatment.doctor_details_treat?.doctor_id || treatment.doctor_id;
      const selectedDoctor = this.doctors.find(d => d.user_id === doctorId) || this.doctor;
      
      const treatmentFormGroup = this.fb.group({
        id: [item.treatment_id],
        unique_id: [item.treatment_unique_id],
        procedureName: [treatment.procedure_details?.name || ''],
        procedureId: [treatment.procedure_details?.procedure_id || treatment.procedure_id],
        quantity: [parseInt(treatment.quantity) || 1],
        cost: [parseFloat(treatment.cost) || 0],
        discount: [parseFloat(treatment.discount) || 0],
        discountType: [treatment.discount_formate || '%'],
        total: [parseFloat(treatment.total_cost) || 0],
        selectedTeeth: [teethArray],
        multiplyCost: [true],
        fullMouth: [false],
        showAdultTeeth: [false],
        showChildTeeth: [false],
        notes: [treatment.notes || ''],
        showNotes: [!!treatment.notes],
        doctorId: [doctorId || this.doctor?.user_id || ''],
        doctorObj: [selectedDoctor],
        procedureDate: [treatment.date ? new Date(treatment.date) : this.date],
        // Additional fields for invoice editing
        invoice_id: [item.invoice_id],
        invoice_item_id: [item.id],
        payment_status: [item.payment_status]
      });
      
      const index = this.treatments.length;
      this.treatments.push(treatmentFormGroup);
      this.calculateTotal(index);
      
      // Subscribe to value changes
      treatmentFormGroup.valueChanges.subscribe(() => {
        this.calculateTotal(index);
      });
    }
  }

  filterProcedures() {
    const search = this.searchText.toLowerCase().trim();
    this.filteredProcedures = this.procedures.filter(procedure => 
      procedure.name.toLowerCase().includes(search) || 
      procedure.price.toString().includes(search)
    );
  }

  addProcedure() {
    if (this.name.trim()) {
      this.treatmentPlansService.addProcedure(this.name, this.cost).subscribe(res => {
        this.name = '';
        this.cost = 0;
        this.add = false;
        this.procedures = [];
        this.getProcedures();
      });
    }
  }

  getProcedures() {
    this.treatmentPlansService.getProcedures().subscribe(res => {
      this.procedures = [];
      res.data.rows.forEach((r: any) => {
        this.procedures.push({
          name: r.name,
          id: r.procedure_id,
          price: r.cost
        });
      });
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
      id: [null],
      unique_id: [null],
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
      doctorObj: [this.doctor],
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

  addPlannedTreatment(procedure: any) {
    const teethArray = procedure.teeth_set.split(',').map((tooth: string) => parseInt(tooth.trim(), 10));
    
    // Find the correct doctor object from the doctors array
    const doctorId = procedure.doctor_details_treat?.doctor_id || this.doctor?.user_id;
    const selectedDoctor = this.doctors.find(d => d.user_id === doctorId) || this.doctor;

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
      doctorId: [doctorId || ''],
      doctorObj: [selectedDoctor],
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
    if (index === null || index >= this.treatments.length || !doctor) return;
    
    const treatment = this.treatments.at(index);
    if (!treatment) return;
    
    // Update both doctorId and doctorObj to keep them in sync
    treatment.get('doctorId')?.setValue(doctor.user_id);
    treatment.get('doctorObj')?.setValue(doctor);
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
    
    if (teethType === 'both') {
      treatment.get('showAdultTeeth')?.setValue(false);
      treatment.get('showChildTeeth')?.setValue(false);
      
      // When Full Mouth is checked, select all teeth
      const fullMouth = treatment.get('fullMouth')?.value;
      if (fullMouth) {
        // Create array of all teeth numbers
        const allTeeth = [
          // Adult upper
          18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
          // Adult lower
          48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
          // Child upper
          55, 54, 53, 52, 51, 61, 62, 63, 64, 65,
          // Child lower
          85, 84, 83, 82, 81, 71, 72, 73, 74, 75
        ];
        treatment.get('selectedTeeth')?.setValue(allTeeth);
      } else {
        // When unchecking Full Mouth, clear all selections
        // treatment.get('selectedTeeth')?.setValue([]);
      }
      
      this.calculateTotal(treatmentIndex);
    } else if (teethType === 'adult') {
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

  onFullMouthChange(treatmentIndex: number): void {
    if (treatmentIndex === null || treatmentIndex >= this.treatments.length) return;
    
    const treatment = this.treatments.at(treatmentIndex);
    if (!treatment) return;
    
    const fullMouth = treatment.get('fullMouth')?.value;

    // All teeth numbers as per the UI
    const allTeeth = [
      // Adult upper
      18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
      // Adult lower
      48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
      // Child upper
      55, 54, 53, 52, 51, 61, 62, 63, 64, 65,
      // Child lower
      85, 84, 83, 82, 81, 71, 72, 73, 74, 75
    ];

    if (fullMouth) {
      treatment.get('selectedTeeth')?.setValue(allTeeth);
    } else {
      treatment.get('selectedTeeth')?.setValue([]);
    }
    
    this.calculateTotal(treatmentIndex);
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
    // Convert negative cost to positive
    const cost = Math.abs(Math.floor(values.cost));
    let total = cost * values.quantity;

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

    // Update the cost value if it was negative
    if (values.cost < 0) {
      treatment.patchValue({ cost }, { emitEvent: false });
    }

    treatment.patchValue({ total }, { emitEvent: false });
    this.calculateGrandTotal();
  }

  onSubmit() {
    if (!this.treatmentForm.valid) return;
    
    const procedureLists: any[] = [];
    const treatment = {
      patient_id: this.patientId,
      grand_total: this.calculateGrandTotal().toString(),
      procedures_list: procedureLists
    };

    if (this.isEditMode) {
      this.treatmentForm.value.treatments.forEach((t: any) => {
        treatment.procedures_list.push({
          procedure_id: t.procedureId,
          treatment_id: t.id,
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
          action: 'Update'
        });
      });
      
      this.treatmentPlansService.updateInvoiceWithTreatmentPlan(treatment).subscribe(res => {
        console.log('Invoice updated:', res);
        this.fetchInvoices();
      });
    } else {
      this.treatmentForm.value.treatments.forEach((t: any) => {
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
        console.log('Invoice created:', res);
        this.fetchInvoices();
      });
    }
  }

  saveAndMakePayment() {
  if (!this.treatmentForm.valid) return;

  const procedureLists: any[] = [];
  const treatment = {
    patient_id: this.patientId,
    grand_total: this.calculateGrandTotal().toString(),
    procedures_list: procedureLists
  };

  this.treatmentForm.value.treatments.forEach((t: any) => {
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

    this.saveInvoices();
    
    // Create a Set of unique invoice IDs
    const uniqueInvoiceIds = new Set(invoices.map((invoice: any) => invoice.invoice_id));

    // Build the selectedInvoiceList for navigation
    this.selectedInvoiceList = Array.from(uniqueInvoiceIds).map((invoiceId: any) => ({
      invoice_id: invoiceId
    }));

    this.router.navigate(
      ['patients', this.patientId, 'add-payment', this.uniqueCode],
      {
        state: {
          procedures: this.selectedInvoiceList,
          message: 'Invoice has been saved, and payment created successfully!'
        }
      }
    );
  });
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

  cancel() {
    this.router.navigate(['/patients', this.patientId, 'invoices', this.uniqueCode]);
  }

  fetchInvoices() {
    this.treatmentPlansService.getInvoices(Number(this.patientId)).subscribe(res => {
      const existingData = this.patientDataService.getSnapshot();
      const updatedData = {
        ...existingData,
        invoices: res
      };
      this.patientDataService.setData(updatedData);
      this.router.navigate(
      ['/patients', this.patientId, 'invoices', this.uniqueCode],
      { state: { message: `Invoice added!` } }
      );
    });
  }

  saveInvoices() {
    this.treatmentPlansService.getInvoices(Number(this.patientId)).subscribe(res => {
      const existingData = this.patientDataService.getSnapshot();
      const updatedData = {
        ...existingData,
        invoices: res
      };
      this.patientDataService.setData(updatedData);
    });
  }

  get sortedCompletedTreatmentPlans() {
    return this.completedTreatmentPlans.slice().sort((a, b) => {
      const nameA = a.procedure_details.name.toLowerCase();
      const nameB = b.procedure_details.name.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  get sortedPlannedTreatmentPlans() {
    return this.plannedTreatmentPlans.slice().sort((a, b) => {
      const nameA = a.procedure_details.name.toLowerCase();
      const nameB = b.procedure_details.name.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  get sortedFilteredProcedures() {
    return this.filteredProcedures.slice().sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  getCostError(index: number): string {
    const costControl = (this.treatments.at(index) as FormGroup).get('cost');
    if (costControl?.errors) {
      if (costControl.errors['required']) {
        return 'Cost is required';
      }
      if (costControl.errors['min']) {
        return 'Cost must be a positive number';
      }
    }
    return '';
  }
}