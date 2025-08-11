import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ImportService {
  // private baseUrl = 'http://localhost:7001/api/v1';
  private baseUrl = 'https://apis.idental.ai/api/v1/auth';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders() {
    const token = this.authService.getAccessToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  private createFormData(file: File, branch_id: string): FormData {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('branch_id', branch_id);
    return formData;
  }

  importAppointments(file: File, branch_id: string) {
    const headers = this.getHeaders();
    const formData = this.createFormData(file, branch_id);

    return this.http.post<any>(
      `${this.baseUrl}/appointment/import`,
      formData,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  importTreatmentPlans(file: File, branch_id: string) {
    const headers = this.getHeaders();
    const formData = this.createFormData(file, branch_id);

    return this.http.post<any>(
      `${this.baseUrl}/treatment/import/plans`,
      formData,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  importInvoices(file: File, branch_id: string) {
    const headers = this.getHeaders();
    const formData = this.createFormData(file, branch_id);

    return this.http.post<any>(
      `${this.baseUrl}/invoice/import`,
      formData,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  importPayments(file: File, branch_id: string) {
    const headers = this.getHeaders();
    const formData = this.createFormData(file, branch_id);

    return this.http.post<any>(
      `${this.baseUrl}/payment/import`,
      formData,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  importProcedures(file: File, branch_id: string) {
    const headers = this.getHeaders();
    const formData = this.createFormData(file, branch_id);

    return this.http.post<any>(
      `${this.baseUrl}/admin/master/importProcedures`,
      formData,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    return throwError(() => error.message || 'Server error');
  }
} 