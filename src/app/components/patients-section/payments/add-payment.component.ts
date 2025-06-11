import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TreatmentPlansService } from '../../../services/treatment-plans.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { MessageService } from '../../../services/message.service';

@Component({
  selector: 'app-add-payment',
  templateUrl: './add-payment.component.html',
  styleUrls: ['./add-payment.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AddPaymentComponent implements OnInit {
  // Payment properties
  amount: string = '0';
  paymentMethod: string = 'cash'; // Changed default to cash
  bank: string = '';
  chequeNumber: string = '';
  cardLastDigits: string = '';
  isAdvancePayment: boolean = true;
  notes: string = '';
  receivedDate: string = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  showNotesInput: boolean = false;
  referenceNumber: string = ''
  
  // Form validation
  formSubmitted: boolean = false;
  amountError: boolean = false;
  bankError: boolean = false;
  chequeNumberError: boolean = false;
  cardDigitsError: boolean = false;
  
  // Selected invoice and payment mode
  selectedInvoices: any[] = [];
  isPayPerService: boolean = false;
  currentViewingInvoice: any = null; // For detailed view of a selected invoice
  
  // Payment calculation fields
  totalFromAdvance: number = 0;
  totalPayNow: number = 0;
  dueAfterAdvance: number = 0;
  dueAfterPayment: number = 0;
  totalAdvanceInput: string = '0'; // New field for editable total advance in one-time mode
  
  // Filter and search
  searchText: string = '';
  filteredInvoices: any[] = [];
  totalPayNowInput: string = '0';
  // API data
  patientId: any;
  availableAdvance: number = 0;
  invoices: any[] = [];
  proceduresToProcess: any[] = [];
  uniqueCode: string | null | undefined;

  constructor(
    private treatmentPlansService: TreatmentPlansService,
    private route: ActivatedRoute, private messageService:MessageService,
    private router: Router,
  ) { 
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

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      if(this.patientId == null) {
        this.patientId = params.get('id');
        this.loadPatientData();
      }
    });
    this.route.paramMap.subscribe(params => {
      if(this.uniqueCode == null) {
        this.uniqueCode = params.get('source');
      }
      if(this.uniqueCode !== null){
        this.messageService.sendMessage(this.patientId ?? '', this.uniqueCode ?? '')
      }
    });
  }
  
  loadPatientData(): void {
    // Get available advance amount
    this.treatmentPlansService.getPatientAdvance(this.patientId).subscribe(res => {
      this.availableAdvance = res.data.available_advance;
    });
    
    // Get pending invoices
    this.treatmentPlansService.getInvoices(Number(this.patientId)).subscribe(res => {
      const rawInvoices = res.data.rows.filter((i: any) => i.payment_status === 'Pending');
      this.invoices = this.groupInvoicesByInvoiceId(rawInvoices);
      this.filteredInvoices = [...this.invoices];
      if(this.proceduresToProcess.length > 0){
        this.proceduresToProcess.forEach(proc => {
          const procedure = this.invoices.find(
            t => t.invoice_id === proc.invoice_id
          );
          if (procedure) {
            this.selectInvoice(procedure);
          }
        });
      }
    });
  }
  
  // Handle payment method change
  onPaymentMethodChange(): void {
    // Reset fields based on payment method
    switch(this.paymentMethod) {
      case 'cheque':
        this.cardLastDigits = '';
        this.referenceNumber = '';
        break;
      case 'card':
        this.bank = '';
        this.chequeNumber = '';
        this.referenceNumber = '';
        break;
      case 'paytm':
      case 'phonepe':
        this.chequeNumber = '';
        this.cardLastDigits = '';
        this.referenceNumber = '';
        break;
      default:
        this.bank = '';
        this.chequeNumber = '';
        this.cardLastDigits = '';
        this.referenceNumber = '';
    }
  }
  
  // Toggle between Pay one time and Pay per Service modes
  togglePaymentMode(): void {
    this.isPayPerService = !this.isPayPerService;
    
    if (this.isPayPerService) {
      // Switching to pay-per-service mode
      this.selectedInvoices.forEach(invoice => {
        // Initialize per-service payment fields
        let totalFromAdvance = parseFloat(invoice.fromAdvanceAmount) || 0;
        let totalPayNow = parseFloat(invoice.payNowAmount) || 0;
        
        // Calculate per-item amounts based on proportional distribution
        invoice.items.forEach((item: any) => {
          const proportion = item.price / invoice.amountDue;
          item.fromAdvance = (totalFromAdvance * proportion).toFixed(2);
          item.payNow = (totalPayNow * proportion).toFixed(2);
        });
      });
    } else {
      // Switching to one-time payment mode
      this.selectedInvoices.forEach(invoice => {
        // Sum up per-service amounts to get totals
        let totalFromAdvance = 0;
        let totalPayNow = 0;
        
        invoice.items.forEach((item: any) => {
          totalFromAdvance += parseFloat(item.fromAdvance) || 0;
          totalPayNow += parseFloat(item.payNow) || 0;
        });
        
        invoice.fromAdvanceAmount = totalFromAdvance.toFixed(2);
        invoice.payNowAmount = totalPayNow.toFixed(2);
      });
      this.totalPayNowInput = this.totalPayNow.toString();

      // Set total advance input for global editing
      this.totalAdvanceInput = this.totalFromAdvance.toString();
    }
    
    this.calculateTotals();
  }
  
  // New method to update total from advance in one-time mode
  updateTotalFromAdvance(value: string): void {
    const newTotalAdvance = parseFloat(value) || 0;
    
    // Ensure new advance amount is not greater than available advance
    const validAdvanceAmount = Math.min(newTotalAdvance, this.availableAdvance);
    
    // Calculate difference from current total
    const difference = validAdvanceAmount - this.totalFromAdvance;
    
    if (difference !== 0) {
      // Distribute proportionally across all invoices
      const totalDueAmount = this.calculateTotalDueAmount();
      
      this.selectedInvoices.forEach(invoice => {
        const proportion = invoice.amountDue / totalDueAmount;
        const currentAdvance = parseFloat(invoice.fromAdvanceAmount) || 0;
        const advanceAdjustment = difference * proportion;
        
        // Calculate new advance amount, ensuring it's not negative or greater than due amount
        const newAdvance = Math.min(
          Math.max(0, currentAdvance + advanceAdjustment),
          invoice.amountDue
        );
        
        invoice.fromAdvanceAmount = newAdvance.toFixed(2);
        
        // Adjust pay now amount based on new advance
        const remainingDue = invoice.amountDue - newAdvance;
        invoice.payNowAmount = Math.min(
          parseFloat(invoice.payNowAmount) || 0,
          remainingDue
        ).toFixed(2);
      });
      
      // Update the input field with valid amount
      this.totalAdvanceInput = validAdvanceAmount.toString();
      
      this.calculateTotals();
    }
  }
  
  // Filter invoices based on search text
  filterInvoices(): void {
    if (!this.searchText.trim()) {
      this.filteredInvoices = [...this.invoices];
      return;
    }
    
    const searchLower = this.searchText.toLowerCase();
    this.filteredInvoices = this.invoices.filter(invoice => 
      invoice.invoice_id.toLowerCase().includes(searchLower) ||
      invoice.items.some((item: any) => item.name.toLowerCase().includes(searchLower))
    );
  }
  
  // Check if an invoice is already selected
  isInvoiceSelected(invoice: any): boolean {
    return this.selectedInvoices.some(inv => inv.invoice_id === invoice.invoice_id);
  }
  
  // Select an invoice
  selectInvoice(invoice: any): void {
    // Check if invoice is already selected
    const existingIndex = this.selectedInvoices.findIndex(inv => inv.invoice_id === invoice.invoice_id);
    
    if (existingIndex !== -1) {
      // If already selected, set it as current viewing invoice
      this.currentViewingInvoice = this.selectedInvoices[existingIndex];
    } else {
      // If not selected, add to selection and set as current viewing
      const invoiceCopy = JSON.parse(JSON.stringify(invoice)); // Create deep copy
      if (!this.isPayPerService) {
        this.totalPayNowInput = this.totalPayNow.toString();
      }
      // Initialize payment fields
      if (this.isPayPerService) {
        invoiceCopy.items.forEach((item: any) => {
          item.fromAdvance = '0';
          item.payNow = '0';
        });
      } else {
        // For one-time payment, default to full amount from available advance
        const availableForThisInvoice = this.availableAdvance > 0 ? 
    Math.min(this.availableAdvance - this.totalFromAdvance, invoice.amountDue) : 0;
        
        invoiceCopy.fromAdvanceAmount = availableForThisInvoice.toString();
        invoiceCopy.payNowAmount = Math.max(0, invoice.amountDue - parseFloat(invoiceCopy.fromAdvanceAmount)).toString();
        invoiceCopy.totalPayNow = parseFloat(invoiceCopy.payNowAmount) || 0;
        invoiceCopy.totalFromAdvance = parseFloat(invoiceCopy.fromAdvanceAmount) || 0;
        invoiceCopy.dueAfterPayment = invoice.amountDue - invoiceCopy.totalFromAdvance - invoiceCopy.totalPayNow;
      }
      
      this.selectedInvoices.push(invoiceCopy);
      this.currentViewingInvoice = invoiceCopy;
    }
    
    this.isAdvancePayment = false;
    this.calculateTotals();
    
    // Update total advance input in one-time mode
    if (!this.isPayPerService) {
      this.totalAdvanceInput = this.totalFromAdvance.toString();
    }
  }
  
  // Remove an invoice from the selection
  removeInvoice(invoice: any): void {
    const index = this.selectedInvoices.findIndex(inv => inv.invoice_id === invoice.invoice_id);
    if (index !== -1) {
      this.selectedInvoices.splice(index, 1);
      
      // If removed current viewing invoice, reset it
      if (this.currentViewingInvoice && this.currentViewingInvoice.invoice_id === invoice.invoice_id) {
        this.currentViewingInvoice = this.selectedInvoices.length > 0 ? this.selectedInvoices[0] : null;
      }
    }
    
    // If no invoices selected, revert to advance payment mode
    if (this.selectedInvoices.length === 0) {
      this.isAdvancePayment = true;
      this.currentViewingInvoice = null;
    }
    
    this.calculateTotals();
    
    // Update total advance input in one-time mode
    if (!this.isPayPerService) {
      this.totalAdvanceInput = this.totalFromAdvance.toString();
    }
    if (!this.isPayPerService) {
      this.totalPayNowInput = this.totalPayNow.toString();
    }
  }
  
  // Calculate total due amount for all invoices
  calculateTotalDueAmount(): number {
    return this.selectedInvoices.reduce((total, invoice) => total + invoice.amountDue, 0);
  }
  
  // Calculate totals for all selected invoices
  calculateTotals(): void {
    this.totalFromAdvance = 0;
    this.totalPayNow = 0;
    this.dueAfterAdvance = 0;
    this.dueAfterPayment = 0;
    
    // Calculate totals for all selected invoices
    this.selectedInvoices.forEach(invoice => {
      if (this.isPayPerService) {
        // Sum up from advance and pay now for all items in current invoice
        invoice.totalFromAdvance = invoice.items.reduce((sum: number, item: any) => {
          return sum + (parseFloat(item.fromAdvance) || 0);
        }, 0);
        
        invoice.totalPayNow = invoice.items.reduce((sum: number, item: any) => {
          return sum + (parseFloat(item.payNow) || 0);
        }, 0);
      } else {
        // For one-time payment
        invoice.totalFromAdvance = parseFloat(invoice.fromAdvanceAmount) || 0;
        invoice.totalPayNow = parseFloat(invoice.payNowAmount) || 0;
      }
      
      // Calculate the remaining amounts for this invoice
      invoice.dueAfterAdvance = invoice.amountDue - invoice.totalFromAdvance;
      invoice.dueAfterPayment = invoice.dueAfterAdvance - invoice.totalPayNow;
      
      // Add to overall totals
      this.totalFromAdvance += invoice.totalFromAdvance;
      this.totalPayNow += invoice.totalPayNow;
      this.dueAfterAdvance += invoice.dueAfterAdvance;
      this.dueAfterPayment += invoice.dueAfterPayment;
    });
    
    // Ensure available advance is not exceeded
    if (this.totalFromAdvance > this.availableAdvance) {
      const excessAmount = this.totalFromAdvance - this.availableAdvance;
      this.adjustAdvanceAmounts(excessAmount);
    }
  }
  
  // Adjust advance amounts if they exceed available advance
  adjustAdvanceAmounts(excessAmount: number): void {
    // Start from the last selected invoice and adjust backwards
    for (let i = this.selectedInvoices.length - 1; i >= 0 && excessAmount > 0; i--) {
      const invoice = this.selectedInvoices[i];
      
      if (this.isPayPerService) {
        // Adjust each item's advance amount
        for (let j = invoice.items.length - 1; j >= 0 && excessAmount > 0; j--) {
          const item = invoice.items[j];
          const itemAdvance = parseFloat(item.fromAdvance) || 0;
          
          if (itemAdvance > 0) {
            const reduction = Math.min(itemAdvance, excessAmount);
            item.fromAdvance = (itemAdvance - reduction).toString();
            excessAmount -= reduction;
            
            // Increase pay now to compensate
            const payNow = parseFloat(item.payNow) || 0;
            item.payNow = (payNow + reduction).toString();
          }
        }
      } else {
        // Adjust the invoice's advance amount
        const invoiceAdvance = parseFloat(invoice.fromAdvanceAmount) || 0;
        
        if (invoiceAdvance > 0) {
          const reduction = Math.min(invoiceAdvance, excessAmount);
          invoice.fromAdvanceAmount = (invoiceAdvance - reduction).toString();
          excessAmount -= reduction;
          
          // Increase pay now to compensate
          const payNow = parseFloat(invoice.payNowAmount) || 0;
          invoice.payNowAmount = (payNow + reduction).toString();
        }
      }
    }
    
    // Update total advance input field in one-time mode
    if (!this.isPayPerService) {
      this.totalAdvanceInput = this.totalFromAdvance.toString();
    }
    
    // Recalculate totals after adjustment (without calling this method again to avoid infinite recursion)
    this.totalFromAdvance = 0;
    this.totalPayNow = 0;
    this.dueAfterAdvance = 0;
    this.dueAfterPayment = 0;
    
    this.selectedInvoices.forEach(invoice => {
      if (this.isPayPerService) {
        invoice.totalFromAdvance = invoice.items.reduce((sum: number, item: any) => {
          return sum + (parseFloat(item.fromAdvance) || 0);
        }, 0);
        
        invoice.totalPayNow = invoice.items.reduce((sum: number, item: any) => {
          return sum + (parseFloat(item.payNow) || 0);
        }, 0);
      } else {
        invoice.totalFromAdvance = parseFloat(invoice.fromAdvanceAmount) || 0;
        invoice.totalPayNow = parseFloat(invoice.payNowAmount) || 0;
      }
      
      invoice.dueAfterAdvance = invoice.amountDue - invoice.totalFromAdvance;
      invoice.dueAfterPayment = invoice.dueAfterAdvance - invoice.totalPayNow;
      
      this.totalFromAdvance += invoice.totalFromAdvance;
      this.totalPayNow += invoice.totalPayNow;
      this.dueAfterAdvance += invoice.dueAfterAdvance;
      this.dueAfterPayment += invoice.dueAfterPayment;
    });
  }
  
  // Calculate due after payment for a specific item in Pay per Service mode
  calculateItemDueAfterPayment(item: any): number {
    const fromAdvance = parseFloat(item.fromAdvance) || 0;
    const payNow = parseFloat(item.payNow) || 0;
    return item.price - fromAdvance - payNow;
  }
  
  // Update from advance amount for an invoice
  updateFromAdvance(invoiceIndex: number, value: string): void {
    if (invoiceIndex >= 0 && invoiceIndex < this.selectedInvoices.length) {
      const invoice = this.selectedInvoices[invoiceIndex];
      invoice.fromAdvanceAmount = value;
      
      // Recalculate invoice and totals
      this.calculateDueAfterAdvance(invoice);
    }
  }
  
  // Update pay now amount for an invoice
  updatePayNow(invoiceIndex: number, value: string): void {
    if (invoiceIndex >= 0 && invoiceIndex < this.selectedInvoices.length) {
      const invoice = this.selectedInvoices[invoiceIndex];
      invoice.payNowAmount = value;
      
      // Recalculate invoice and totals
      this.calculateDueAfterPayment(invoice);
    }
  }
  
  // Calculate due after advance for one-time payment of an invoice
  calculateDueAfterAdvance(invoice: any): void {
    if (!invoice) return;
    
    const advanceAmount = parseFloat(invoice.fromAdvanceAmount) || 0;
    invoice.totalFromAdvance = advanceAmount;
    invoice.dueAfterAdvance = invoice.amountDue - advanceAmount;
    
    this.calculateDueAfterPayment(invoice);
    this.calculateTotals();
  }
  
  // Calculate due after payment for one-time payment of an invoice
  calculateDueAfterPayment(invoice: any): void {
    if (!invoice) return;
    
    const payNowAmount = parseFloat(invoice.payNowAmount) || 0;
    invoice.totalPayNow = payNowAmount;
    invoice.dueAfterPayment = invoice.dueAfterAdvance - payNowAmount;
    
    this.calculateTotals();
  }
  
  // Update from advance amount for an item in pay per service mode
  updateItemFromAdvance(invoiceIndex: number, itemIndex: number, value: string): void {
    if (invoiceIndex >= 0 && invoiceIndex < this.selectedInvoices.length) {
      const invoice = this.selectedInvoices[invoiceIndex];
      
      if (itemIndex >= 0 && itemIndex < invoice.items.length) {
        invoice.items[itemIndex].fromAdvance = value;
        
        // Recalculate invoice and totals
        this.updateItemPayment(invoiceIndex, itemIndex);
      }
    }
  }
  
  // Update pay now amount for an item in pay per service mode
  updateItemPayNow(invoiceIndex: number, itemIndex: number, value: string): void {
    if (invoiceIndex >= 0 && invoiceIndex < this.selectedInvoices.length) {
      const invoice = this.selectedInvoices[invoiceIndex];
      
      if (itemIndex >= 0 && itemIndex < invoice.items.length) {
        invoice.items[itemIndex].payNow = value;
        
        // Recalculate invoice and totals
        this.updateItemPayment(invoiceIndex, itemIndex);
      }
    }
  }
  updateTotalPayNow(value: string): void {
    const newTotalPayNow = parseFloat(value) || 0;
    
    // Calculate difference from current total
    const difference = newTotalPayNow - this.totalPayNow;
    
    if (difference !== 0) {
      // Distribute proportionally across all invoices
      const totalDueAmount = this.calculateTotalDueAmount();
      
      this.selectedInvoices.forEach(invoice => {
        const proportion = invoice.amountDue / totalDueAmount;
        const currentPayNow = parseFloat(invoice.payNowAmount) || 0;
        const payNowAdjustment = difference * proportion;
        
        // Calculate new pay now amount, ensuring it's not negative or greater than remaining due
        const maxPayNow = invoice.amountDue - parseFloat(invoice.fromAdvanceAmount);
        const newPayNow = Math.min(
          Math.max(0, currentPayNow + payNowAdjustment),
          maxPayNow
        );
        
        invoice.payNowAmount = newPayNow.toFixed(2);
      });
      
      // Update the input field
      this.totalPayNowInput = newTotalPayNow.toString();
      
      this.calculateTotals();
    }
  }
  // Update payment calculations after modifying an item
  updateItemPayment(invoiceIndex: number, itemIndex: number): void {
    if (invoiceIndex >= 0 && invoiceIndex < this.selectedInvoices.length) {
      const invoice = this.selectedInvoices[invoiceIndex];
      
      if (itemIndex >= 0 && itemIndex < invoice.items.length) {
        // Recalculate the invoice totals based on all items
        let totalFromAdvance = 0;
        let totalPayNow = 0;
        
        invoice.items.forEach((item: any) => {
          totalFromAdvance += parseFloat(item.fromAdvance) || 0;
          totalPayNow += parseFloat(item.payNow) || 0;
        });
        
        invoice.totalFromAdvance = totalFromAdvance;
        invoice.totalPayNow = totalPayNow;
        invoice.dueAfterAdvance = invoice.amountDue - totalFromAdvance;
        invoice.dueAfterPayment = invoice.dueAfterAdvance - totalPayNow;
        
        // Recalculate overall totals
        this.calculateTotals();
      }
    }
  }
  
  // Open date picker
  openDatePicker(): void {
    console.log('Opening date picker...');
    // Implementation for date picker would go here
  }
  
  // Add notes functionality
  addNotes(): void {
    this.showNotesInput = !this.showNotesInput;
  }
  
  // Validate form before saving
  isFormValid(): boolean {
    // Different validation logic based on payment mode
    if (this.selectedInvoices.length > 0) {
      // If invoices are selected
      const totalPayment = this.totalFromAdvance + this.totalPayNow;
      
      // Basic validation - ensure total payment is greater than zero
      if (totalPayment <= 0) {
        this.amountError = true;
        return false;
      }
      
      // Check each invoice
      for (const invoice of this.selectedInvoices) {
        const invoicePayment = invoice.totalFromAdvance + invoice.totalPayNow;
        
        // Ensure payment doesn't exceed due amount
        if (invoicePayment > invoice.amountDue) {
          this.amountError = true;
          return false;
        }
      }
      
      // Ensure advance payment doesn't exceed available advance
      if (this.totalFromAdvance > this.availableAdvance) {
        return false;
      }
    } else {
      // Advance payment mode
      if (!this.amount || parseFloat(this.amount) <= 0) {
        this.amountError = true;
        return false;
      }
    }
    
    // Method-specific validation
    switch(this.paymentMethod) {
      case 'cheque':
        if (!this.bank) this.bankError = true;
        if (!this.chequeNumber) this.chequeNumberError = true;
        return !!this.bank && !!this.chequeNumber;
      case 'card':
        if (this.cardLastDigits.length !== 4) this.cardDigitsError = true;
        return this.cardLastDigits.length === 4;
      case 'paytm':
      case 'phonepe':
        if (!this.bank) this.bankError = true;
        return !!this.bank;
      default:
        return true;
    }
  }
  
  // Reset validation errors
  resetValidationErrors(): void {
    this.amountError = false;
    this.bankError = false;
    this.chequeNumberError = false;
    this.cardDigitsError = false;
  }
  
  // Set validation errors based on current state
  setValidationErrors(): void {
    // Amount validation
    if (this.selectedInvoices.length > 0) {
      const totalPayment = this.totalFromAdvance + this.totalPayNow;
      this.amountError = totalPayment <= 0;
      
      // Check each invoice for exceeding due amount
      for (const invoice of this.selectedInvoices) {
        const invoicePayment = invoice.totalFromAdvance + invoice.totalPayNow;
        if (invoicePayment > invoice.amountDue) {
          this.amountError = true;
          break;
        }
      }
    } else {
      // Advance payment mode
      this.amountError = !this.amount || parseFloat(this.amount) <= 0;
    }
    
    // Method-specific validation
    switch(this.paymentMethod) {
      case 'cheque':
        this.bankError = !this.bank;
        this.chequeNumberError = !this.chequeNumber;
        break;
      case 'card':
        this.cardDigitsError = this.cardLastDigits.length !== 4;
        break;
      case 'paytm':
      case 'phonepe':
        this.bankError = !this.bank;
        break;
    }
  }
  
  /**
   * Group invoices by invoice_id
   * @param rawInvoices Raw invoice data from API
   * @returns Array of grouped invoices ready for display
   */
  groupInvoicesByInvoiceId(rawInvoices: any[]): any[] {
    // Get unique invoice IDs
    const uniqueInvoiceIds = [...new Set(rawInvoices.map(inv => inv.invoice_id))];
    const groupedInvoices: Record<string, any> = {};

    uniqueInvoiceIds.forEach(invoiceId => {
      const invoicesForId = rawInvoices.filter(inv => inv.invoice_id === invoiceId);
      
      // Calculate totals
      let totalAmount = 0;
      let paidAmount = 0;
      
      // Get the items/services for this invoice
      const items = invoicesForId.map(inv => {
        const itemCost = parseFloat(inv.treatment_plans.total_cost) || 0;
        totalAmount += itemCost;
        
        // Determine paid amount based on payment_status
        if (inv.payment_status === 'Paid') {
          paidAmount += itemCost;
        }
        
        return {
          id: inv.treatment_id,
          unique_id: inv.treatment_unique_id,
          name: inv.treatment_plans.procedure_details.name,
          price: itemCost,
          teeth_set: inv.treatment_plans.teeth_set,
          quantity: inv.treatment_plans.quantity,
          fromAdvance: '0',
          payNow: '0'
        };
      });
      
      // Use the first invoice for common details
      const firstInvoice = invoicesForId[0];
      
      groupedInvoices[invoiceId] = {
        invoice_id: invoiceId,
        created_at: firstInvoice.created_at,
        payment_status: this.calculateOverallStatus(invoicesForId),
        items: items,
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        amountDue: totalAmount - paidAmount
      };
    });

    // Convert to array for Angular ngFor
    return Object.values(groupedInvoices);
  }

  /**
   * Determine overall payment status for an invoice group
   */
  calculateOverallStatus(invoices: any[]): string {
    // If all are paid, status is Paid
    if (invoices.every(inv => inv.payment_status === 'Paid')) {
      return 'Paid';
    }
    // If all are pending, status is Pending
    if (invoices.every(inv => inv.payment_status === 'Pending')) {
      return 'Pending';
    }
    // Otherwise, it's partially paid
    return 'Partially Paid';
  }
  
  // Save payment
  savePayment(): void {
    this.formSubmitted = true;
    this.resetValidationErrors();
    
    // Validate form fields
    if (!this.isFormValid()) {
      this.setValidationErrors();
      return;
    }
    
    // Prepare payment data based on the selected mode
    const paymentData: any = {
      patient_id: Number(this.patientId),
      payment_method: this.paymentMethod.charAt(0).toUpperCase() + this.paymentMethod.slice(1), // Capitalize
      bank_name: this.bank,
      cheque_number: this.chequeNumber,
      card_digits: this.cardLastDigits,
      reference_number: this.referenceNumber,
      amount_paid: this.totalPayNow.toString(),
      notes: this.notes,
      use_advance_amount: this.totalFromAdvance.toString(),
      invoices_data: []
    };

    console.log('check if reference number is being added', paymentData)
    
    // Add invoice data for selected invoices
    if (this.selectedInvoices.length > 0) {
      this.selectedInvoices.forEach(invoice => {
        const invoiceData: any = {
          invoice_id: invoice.invoice_id,
          amount_applied: invoice.totalPayNow.toString(),
          treatments: []
        };
        
        if (this.isPayPerService) {
          // Add per-service payment details
          invoice.items.forEach((item: any) => {
            if (parseFloat(item.fromAdvance) > 0 || parseFloat(item.payNow) > 0) {
              invoiceData.treatments.push({
                treatment_id: item.id,
                treatment_unique_id: item.unique_id,
                from_advance: item.fromAdvance,
                amount_applied: item.payNow
              });
            }
          });
        } else {
          // For one-time payment, distribute proportionally across treatments
          let remainingAdvance = parseFloat(invoice.fromAdvanceAmount);
          let remainingPayNow = parseFloat(invoice.payNowAmount);
          
          invoice.items.forEach((item: any, index: number) => {
            const isLastItem = index === invoice.items.length - 1;
            let itemAdvance = 0;
            let itemPayNow = 0;
            
            if (isLastItem) {
              // Last item gets all remaining amounts
              itemAdvance = remainingAdvance;
              itemPayNow = remainingPayNow;
            } else {
              // Distribute proportionally
              const itemProportion = item.price / invoice.totalAmount;
              itemAdvance = Math.min(remainingAdvance, itemProportion * parseFloat(invoice.fromAdvanceAmount));
              itemPayNow = Math.min(remainingPayNow, itemProportion * parseFloat(invoice.payNowAmount));
              
              // Round to 2 decimal places
              itemAdvance = Math.round(itemAdvance * 100) / 100;
              itemPayNow = Math.round(itemPayNow * 100) / 100;
            }
            
            remainingAdvance -= itemAdvance;
            remainingPayNow -= itemPayNow;
            
            invoiceData.treatments.push({
              treatment_id: item.id,
              treatment_unique_id: item.unique_id,
              from_advance: itemAdvance.toString(),
              amount_applied: itemPayNow.toString()
            });
          });
        }
        
        paymentData.invoices_data.push(invoiceData);
        paymentData.record_type = 'FromInvoice'
      });
    } else {
      // This is an advance payment with no invoices
      paymentData.amount_paid = this.amount;
      paymentData.use_advance_amount = "0";
      paymentData.record_type = 'FromUser'
    }
    
    this.treatmentPlansService.savePayment(paymentData).subscribe(res => {
      this.router.navigate(['patients', this.patientId, 'payments', this.uniqueCode])
    });
  }
  
  navigateToPayment(){
    this.router.navigate(['patients', this.patientId, 'payments', this.uniqueCode])
  }
  
  navigateToAddInvoice(){
    this.router.navigate(['patients', this.patientId, 'add-invoice', this.uniqueCode]);
  }
}