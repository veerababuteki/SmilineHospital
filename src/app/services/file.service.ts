import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { options } from '@fullcalendar/core/preact.js';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private baseUrl = 'https://apis.idental.ai/auth';  // Replace with actual API
  loggedIn: boolean = false;

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}

  getFileLabels(){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<any>(`${this.baseUrl}/getAllFileLabel`, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  saveFileLabel(name: string){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });


    return this.http.post<any>(`${this.baseUrl}/addFileLabel`,{name: name}, {headers}).pipe(
        catchError(this.handleError)
      );
  }
  saveFile(formData: FormData){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    formData.forEach((value, key) => console.log(key, value));


    return this.http.post<any>(`${this.baseUrl}/addFileData`, formData, {headers}).pipe(
        catchError(this.handleError)
      );
  }
  getDoctors(docRoleID: any) {
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/getExistingUser/${docRoleID}`, {headers}).pipe(
        catchError(this.handleError)
      );
  }
  getPatientFiles(patientId: number){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/getAllFiles/${patientId}`, {headers}).pipe(
        catchError(this.handleError)
      );  
  }
  getPatient(code: any) {
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/getProfileForAppointment/${code}`, {headers}).pipe(
        catchError(this.handleError)
      );
  }  
  getCategories(){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/getAllCategories`, { headers});
  }

  addCategory(name: string){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const body = { name: name };

    return this.http.post<any>(`${this.baseUrl}/addCategory`,{name: name}, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  deleteFile(id: any){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const body = { name: name };

    return this.http.post<any>(`${this.baseUrl}/deleteFilesData/${id}`, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => error.message || 'Server error');
  }

}