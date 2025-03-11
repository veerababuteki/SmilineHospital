import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})

export class ClinicalNotesService {
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

  getClinicalNotes(patient_id: number){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/getAllClinicalNotes/${patient_id}`, {headers}).pipe(
        catchError(this.handleError)
      );
  }
  saveClinicalNotes(clinicalNote: any){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/addClinicalNotes`,{ 
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
  markAsComplete(treatment_list: any[]){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/makeMarkAsCompleted`,{treatment_list}, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  getInvestigations(){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/master/getAllInvestigations`).pipe(
        catchError(this.handleError)
      );
  }
  getObservations(){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/master/getAllObservation`).pipe(
        catchError(this.handleError)
      );
  }
  getDiagnoses(){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/master/getAllDiagnoses`).pipe(
        catchError(this.handleError)
      );
  }
  getComplaints(){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/master/getAllChiefComplaints`).pipe(
        catchError(this.handleError)
      );
  }
  getNotes(){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/master/getAllNotes`).pipe(
        catchError(this.handleError)
      );
  }
  addInvestigations(item: string){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/master/addInvestigation`, {
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

    return this.http.post<any>(`${this.baseUrl}/master/addObservation`, {
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

    return this.http.post<any>(`${this.baseUrl}/master/addDiagnoses`, {
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

    return this.http.post<any>(`${this.baseUrl}/master/addChiefComplaints`, {
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

    return this.http.post<any>(`${this.baseUrl}/master/addNotes`, {
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

    return this.http.post<any>(`${this.baseUrl}/master/addMedicalHistory`, {
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

    return this.http.post<any>(`${this.baseUrl}/master/addGroups`, {
      "name": item
    }).pipe(
        catchError(this.handleError)
      );
  }
  private handleError(error: HttpErrorResponse) {
    return throwError(() => error.message || 'Server error');
  }

}