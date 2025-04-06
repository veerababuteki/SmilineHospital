import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})

export class TreatmentPlansService {
  
  private baseUrl = 'https://apis.idental.ai/auth';  // Replace with actual API
  loggedIn: boolean = false;

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}
  
  getProcedures(){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/getAllProcedures`, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  addProcedure(name: string, cost: number){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/addProcedure`,{ name: name, cost: cost }, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  addTreatmentPlan(treatmentPlan: any){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/addTreatments`,{ 
        doctor_id: treatmentPlan.doctor_id,
        patient_id: treatmentPlan.patient_id,
        grand_total: treatmentPlan.grand_total,
        procedures_list: treatmentPlan.procedures_list
    }, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  addCompletedProcedure(treatmentPlan: any){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/addCompletedProcedures`,{ 
        patient_id: treatmentPlan.patient_id,
        grand_total: treatmentPlan.grand_total,
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

    return this.http.post<any>(`${this.baseUrl}/addInvoiceDirect`,{ 
        patient_id: treatmentPlan.patient_id,
        grand_total: treatmentPlan.grand_total,
        procedures_list: treatmentPlan.procedures_list
    }, {headers}).pipe(
        catchError(this.handleError)
      );
  }
  getTreatmentPlans(patient_id: number){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/getAllTreatments/${patient_id}`, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  markAsComplete(treatment_list: any[]){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/makeMarkAsCompleted`,{treatment_list}, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  getCompletedTreatmentPlans(patientId: number){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/getCompletedProcedures/${patientId}`, {headers}).pipe(
        catchError(this.handleError)
      );
  }
  generateInvoice(treatment_plans: number[]){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/addInvoice`, {treatment_plans}, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  getInvoices(patientId: number){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/getAllInvoices/${patientId}`, {headers}).pipe(
        catchError(this.handleError)
      );
  }
  
  cancelInvoice(invoiceId: string){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post<any>(`${this.baseUrl}/cancelInvoice/${invoiceId}`, {headers}).pipe(
      catchError(this.handleError)
    );
  }

  makePayment(invoice: any){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/addPayment`, {
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

    return this.http.get<any>(`${this.baseUrl}/getAllPayments/${patientId}`, {headers}).pipe(
        catchError(this.handleError)
      );
  }
  private handleError(error: HttpErrorResponse) {
    return throwError(() => error.message || 'Server error');
  }

}