import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})

export class SfcService {
  private baseUrl = 'https://apis.idental.ai/api/v1/auth/sfc'; // base path for SFC routes
  // private baseUrl = 'http://localhost:7001/api/v1/auth/sfc'; // base path for SFC routes

  constructor(private http: HttpClient, private authService: AuthService) {}

  getAllSfcEntries() {
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http
      .get<any>(`${this.baseUrl}/all`, { headers })
      .pipe(catchError(this.handleError));
  }

  addSfcEntry(data: any) {
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http
      .post<any>(`${this.baseUrl}/add`, data, { headers })
      .pipe(catchError(this.handleError));
  }

  updateSfcEntry(id: number, updatedData: any) {
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http
      .put<any>(`${this.baseUrl}/update/${id}`, updatedData, { headers })
      .pipe(catchError(this.handleError));
  }

  deleteSfcEntry(id: number) {
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http
      .delete<any>(`${this.baseUrl}/delete/${id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  getSfcEntryById(id: number) {
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http
      .get<any>(`${this.baseUrl}/get/${id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => error.message || 'Server error');
  }
}
