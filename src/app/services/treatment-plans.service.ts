import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../Env/environment';

@Injectable({
  providedIn: 'root',
})

export class TreatmentPlansService {
  
  private baseUrl = environment.baseUrl;
  // private baseUrl = 'https://apis.idental.ai/api/v1';  // Replace with actual API
  loggedIn: boolean = false;

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}
  
  getProcedures(){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/admin/master/getAllProcedures`, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  addProcedure(name: string, cost: number){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/admin/master/addProcedure`,{ name: name, cost: cost }, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  addTreatmentPlan(treatmentPlan: any){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/auth/treatment/addTreatments`,{ 
        doctor_id: treatmentPlan.doctor_id,
        patient_id: treatmentPlan.patient_id,
        grand_total: treatmentPlan.grand_total,
        procedures_list: treatmentPlan.procedures_list
    }, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  updateTreatmentPlan(treatmentPlan: any){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/auth/treatment/editTreatments`,{ 
      treatment_plan: treatmentPlan.procedures_list
    }, {headers}).pipe(
        catchError(this.handleError)
      );
  }
  
  addCompletedProcedure(treatmentPlan: any){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/auth/treatment/addCompletedProcedures`,{ 
        patient_id: treatmentPlan.patient_id,
        grand_total: treatmentPlan.grand_total,
        procedures_list: treatmentPlan.procedures_list
    }, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  updateCompletedProcedure(treatmentPlan: any){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
        
    return this.http.post<any>(`${this.baseUrl}/auth/treatment/editCompletedProcedures`,{ 
        procedures_list: treatmentPlan.procedures_list
    }, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  addInvoiceWithTreatmentPlan(treatmentPlan: any){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/auth/invoice/addInvoiceDirect`,{ 
        patient_id: treatmentPlan.patient_id,
        grand_total: treatmentPlan.grand_total,
        procedures_list: treatmentPlan.procedures_list
    }, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  updateInvoiceWithTreatmentPlan(treatmentPlan: any){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/auth/invoice/editInvoice`,{ 
      treatment_plans: treatmentPlan.procedures_list
    }, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  getTreatmentPlans(patient_id: number){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/auth/treatment/getAllTreatments/${patient_id}`, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  markAsComplete(treatment_list: any[]){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/auth/treatment/makeMarkAsCompleted`,{treatment_list}, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  getCompletedTreatmentPlans(patientId: number){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/auth/treatment/getCompletedProcedures/${patientId}`, {headers}).pipe(
        catchError(this.handleError)
      );
  }
  generateInvoice(treatment_plans: number[]){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/auth/invoice/addInvoice`, {treatment_plans}, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  getInvoices(patientId: number){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/auth/invoice/getAllInvoices/${patientId}`, {headers}).pipe(
        catchError(this.handleError)
      );
  }
  
  cancelInvoice(invoiceId: string){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post<any>(`${this.baseUrl}/auth/invoice/cancelInvoice/${invoiceId}`, {headers}).pipe(
      catchError(this.handleError)
    );
  }

  makePayment(invoice: any){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/auth/payment/addPayment`, {
        invoice_id: invoice.invoice_id,
        payment_mode: invoice.payment_mode,
        amount_paid: invoice.amount_paid,
        record_type: "FromInvoice",
        notes: ''
    },{headers}).pipe(
        catchError(this.handleError)
      );
  }
  getPayments(patientId: number) {
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/auth/payment/getAllPayments/${patientId}`, {headers}).pipe(
        catchError(this.handleError)
      );
  }
  getPatientAdvance(patientId: number) {
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/auth/payment/fetchPatientAdvacnce/${patientId}`, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  savePayment(paymentData: any){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/auth/payment/savePaymentByInvoice`, {
      "patient_id": paymentData.patient_id,
      "payment_method": paymentData.payment_method,
      "cheque_number": paymentData.cheque_number,
      "bank_account_no": paymentData.bank_account_no,
      "record_type": paymentData.record_type,
      "bank_name": paymentData.bank_name,
      "card_digits": paymentData.card_digits,
      "amount_paid": paymentData.amount_paid,
      "notes": paymentData.notes,
      "use_advance_amount": paymentData.use_advance_amount,
      "invoices_data": paymentData.invoices_data,
      "reference_number" : paymentData.reference_number
    }, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => error.message || 'Server error');
  }

}