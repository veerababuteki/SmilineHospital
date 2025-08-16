import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { options } from '@fullcalendar/core/preact.js';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  // private baseUrl = 'http://localhost:7001/api/v1/auth';  // Replace with actual API
  private baseUrl = 'https://apis.idental.ai/api/v1/auth';  // Replace with actual API
  loggedIn: boolean = false;

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}

   // 1. Payments Report
  getPayments(from_date: any, to_date: any, branch_id: number): Observable<any> {
    const params = new HttpParams()
      .set('from_date', new Date(from_date).toISOString().split('T')[0])
      .set('to_date', new Date(to_date).toISOString().split('T')[0])
      .set('branch_id', branch_id);
    return this.http.get(`${this.baseUrl}/report/payments`, { headers: this.getAuthHeaders(), params })
      .pipe(catchError(this.handleError));
  }

  // 2. Appointments Report
  getAppointments(from_date: any, to_date: any, branch_id: number): Observable<any> {
    const params = new HttpParams()
      .set('from_date', new Date(from_date).toISOString().split('T')[0])
      .set('to_date', new Date(to_date).toISOString().split('T')[0])
      .set('branch_id', branch_id);
    return this.http.get(`${this.baseUrl}/report/appointments`, { headers: this.getAuthHeaders(), params })
      .pipe(catchError(this.handleError));
  }

  // 3. Patients Report
  getPatients(from_date: any, to_date: any, branch_id: number): Observable<any> {
    const params = new HttpParams()
      .set('from_date', new Date(from_date).toISOString().split('T')[0])
      .set('to_date', new Date(to_date).toISOString().split('T')[0])
      .set('branch_id', branch_id);
    return this.http.get(`${this.baseUrl}/report/patients`, { headers: this.getAuthHeaders(), params })
      .pipe(catchError(this.handleError));
  }

  // 4. Daily Summary Report
  getDailySummary(date: any, branch_id: number): Observable<any> {
    const params = new HttpParams()
      .set('date', date)
      .set('branch_id', branch_id);
    return this.http.get(`${this.baseUrl}/report/dailySummary`, { headers: this.getAuthHeaders(), params })
      .pipe(catchError(this.handleError));
  }

  // 5. Amount Due Report
  getAmountDue(branch_id: number): Observable<any> {
    const params = new HttpParams().set('branch_id', branch_id);
    return this.http.get(`${this.baseUrl}/report/amountdue`, { headers: this.getAuthHeaders(), params })
      .pipe(catchError(this.handleError));
  }

  // 6. EMR Report
  getEMR(from_date: any, to_date: any, branch_id: number): Observable<any> {
    const params = new HttpParams()
      .set('from_date', new Date(from_date).toISOString().split('T')[0])
      .set('to_date', new Date(to_date).toISOString().split('T')[0])
      .set('branch_id', branch_id);
    return this.http.get(`${this.baseUrl}/report/emr`, { headers: this.getAuthHeaders(), params })
      .pipe(catchError(this.handleError));
  }

  // 7. Invoices Report
  getInvoices(from_date: any, to_date: any, branch_id: number): Observable<any> {
    const params = new HttpParams()
      .set('from_date', new Date(from_date).toISOString().split('T')[0])
      .set('to_date', new Date(to_date).toISOString().split('T')[0])
      .set('branch_id', branch_id);
    return this.http.get(`${this.baseUrl}/report/invoices`, { headers: this.getAuthHeaders(), params })
      .pipe(catchError(this.handleError));
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => error.message || 'Server error');
  }

}