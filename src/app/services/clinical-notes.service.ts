import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})

export class ClinicalNotesService {
  private baseUrl = 'https://apis.idental.ai/api/v1';  // Replace with actual API
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

  getClinicalNotes(patient_id: number){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/auth/clinical/getAllClinicalNotes/${patient_id}`, {headers}).pipe(
        catchError(this.handleError)
      );
  }
  saveClinicalNotes(clinicalNote: any){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/auth/clinical/addClinicalNotes`,{ 
      chief_complaints: clinicalNote.chief_complaints,
      observations: clinicalNote.observations,
      investigations: clinicalNote.investigations,
      diagnoses: clinicalNote.diagnoses,
      notes: clinicalNote.notes,
      followup_appointment: clinicalNote.followup_appointment,
      doctor_id: clinicalNote.doctor_id,
      date: clinicalNote.date,
      patient_id: clinicalNote.patient_id,
      appointment_id: clinicalNote.appointment_id,
    }, {headers}).pipe(
        catchError(this.handleError)
      );
  }
  
  updateClinicalNotes(clinicalNote: any){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/auth/clinical/updateClinicalNote`,{ 
      id: clinicalNote.id,
      chief_complaints: clinicalNote.chief_complaints,
      observations: clinicalNote.observations,
      investigations: clinicalNote.investigations,
      diagnoses: clinicalNote.diagnoses,
      notes: clinicalNote.notes,
      followup_appointment: clinicalNote.followup_appointment,
      doctor_id: clinicalNote.doctor_id,
      date: clinicalNote.date,
      patient_id: clinicalNote.patient_id,
      appointment_id: clinicalNote.appointment_id,
    }, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  getInvestigations(){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/admin/master/getAllInvestigations`).pipe(
        catchError(this.handleError)
      );
  }

  getObservations(){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/admin/master/getAllObservation`).pipe(
        catchError(this.handleError)
      );
  }

  getDiagnoses(){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/admin/master/getAllDiagnoses`).pipe(
        catchError(this.handleError)
      );
  }

  getComplaints(){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/admin/master/getAllChiefComplaints`).pipe(
        catchError(this.handleError)
      );
  }

  getNotes(){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/admin/group/getAllNotes`).pipe(
        catchError(this.handleError)
      );
  }

  addInvestigations(item: string){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/admin/master/addInvestigation`, {
      "name": item
    }).pipe(
        catchError(this.handleError)
      );
  }
  addObservations(item: string){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/admin/master/addObservation`, {
      "name": item
    }).pipe(
        catchError(this.handleError)
      );
  }
  addDiagnoses(item: string){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/admin/master/addDiagnoses`, {
      "name": item
    }).pipe(
        catchError(this.handleError)
      );
  }
  addComplaints(item: string){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/admin/master/addChiefComplaints`, {
      "name": item
    }).pipe(
        catchError(this.handleError)
      );
  }

  addNotes(item: string){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/admin/group/addNotes`, {
      "name": item
    }).pipe(
        catchError(this.handleError)
      );
  }

  addMedicalHistory(item: string){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/admin/group/addMedicalHistory`, {
      "name": item
    }).pipe(
        catchError(this.handleError)
      );
  }

  addGroup(item: string){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/admin/group/addGroups`, {
      "name": item
    }).pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => error.message || 'Server error');
  }

}