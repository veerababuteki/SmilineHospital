import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { options } from '@fullcalendar/core/preact.js';
import { environment } from '../../Env/environment';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private baseUrl = `${environment.baseUrl}/auth`;
  // private baseUrl = 'https://apis.idental.ai/api/v1/auth';  // Replace with actual API
  loggedIn: boolean = false;

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}

   // 1. Payments Report
  getPayments(from_date: any, to_date: any, branch_id: number): Observable<any> {
    const params = new HttpParams()
      .set('from_date', new Date(from_date).toLocaleDateString('en-CA'))
      .set('to_date', new Date(to_date).toLocaleDateString('en-CA'))
      .set('branch_id', branch_id);
    return this.http.get(`${this.baseUrl}/report/payments`, { headers: this.getAuthHeaders(), params })
      .pipe(catchError(this.handleError));
  }

  // 2. Appointments Report
  getAppointments(from_date: any, to_date: any, branch_id: number): Observable<any> {
  const formatDate = (d: any) => {
    const date = new Date(d);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // local date, not UTC
  };

  const params = new HttpParams()
    .set('from_date', formatDate(from_date))
    .set('to_date', formatDate(to_date))
    .set('branch_id', branch_id);

  return this.http.get(`${this.baseUrl}/report/appointments`, {
    headers: this.getAuthHeaders(),
    params
  }).pipe(catchError(this.handleError));
}

  // 3. Patients Report
  getPatients(from_date: any, to_date: any, branch_id: number): Observable<any> {
    const fromDateTime = new Date(from_date);
  fromDateTime.setHours(0, 0, 0, 0);

  const toDateTime = new Date(to_date);
  toDateTime.setHours(23, 59, 59, 999);

  const params = new HttpParams()
    .set('from_date', fromDateTime.toISOString().slice(0, 19).replace('T', ' '))
    .set('to_date', toDateTime.toISOString().slice(0, 19).replace('T', ' '))
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
  const fromDateTime = new Date(from_date);
  fromDateTime.setHours(0, 0, 0, 0);

  const toDateTime = new Date(to_date);
  toDateTime.setHours(23, 59, 59, 999);

  const params = new HttpParams()
    .set('from_date', fromDateTime.toISOString().slice(0, 19).replace('T', ' '))
    .set('to_date', toDateTime.toISOString().slice(0, 19).replace('T', ' '))
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