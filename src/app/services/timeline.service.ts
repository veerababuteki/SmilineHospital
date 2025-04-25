import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { options } from '@fullcalendar/core/preact.js';

@Injectable({
  providedIn: 'root',
})
export class TimelineService {
  private baseUrl = 'https://apis.idental.ai/api/v1';  // Replace with actual API
  loggedIn: boolean = false;

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}

  
  getPatientTimeline(patientId: number){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/auth/report/getPatientTimeline/${patientId}`, {headers}).pipe(
        catchError(this.handleError)
      );  
  }
  

  private handleError(error: HttpErrorResponse) {
    return throwError(() => error.message || 'Server error');
  }

}