import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})

export class AppointmentService {
  private baseUrl = 'https://apis.idental.ai/api/v1/auth/appointment';  // Replace with actual API
  loggedIn: boolean = false;
  selectedPractice: any;

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}

  getAppointmentsByPatientID(patientId: any){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<any>(`${this.baseUrl}/getAppointmentByPatientId/${patientId}`, {headers}).pipe(
        catchError(this.handleError)
      );
  }
  
  getAppointment(id: number){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    const params = new HttpParams()
        .set('id', id);
    return this.http.get<any>(`${this.baseUrl}/getAppointment`, {headers, params});
  }

  getAppointments(from_date: any, to_date: any){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    const savedPractice = localStorage.getItem('selectedPractice');
    if(savedPractice){
      this.selectedPractice = JSON.parse(savedPractice);
    }

    return this.http.get<any>(`${this.baseUrl}/appointmentsByDateAndBranch?from_date=${from_date}&to_date=${to_date}&branch_id=${this.selectedPractice.branch_id}`, { headers });
  }

  updateAppointment(appointment: any){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });


    return this.http.post<any>(`${this.baseUrl}/updateAppointment`,
        {
            id: appointment.id,
            patient_id: appointment.patient_id,
            booking_type: appointment.booking_type,
            status: appointment.status,
            appointment_status: appointment.appointment_status,
            doctor_id: appointment.doctor_id,
            category_id: appointment.category_id,
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            duration: appointment.duration,
            planned_procedure: appointment.planned_procedure,
            notes: appointment.notes,
        }, 
        {headers}).pipe(
        catchError(this.handleError)
      );
  }

  createAppointment(appointment: any){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    const savedPractice = localStorage.getItem('selectedPractice');
    if(savedPractice){
      this.selectedPractice = JSON.parse(savedPractice);
    }

    return this.http.post<any>(`${this.baseUrl}/createAppointment`,
        {
            patient_id: appointment.patient_id,
            booking_type: appointment.booking_type,
            status: appointment.status,
            appointment_status: appointment.appointment_status,
            doctor_id: appointment.doctor_id,
            category_id: appointment.category_id,
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            duration: appointment.duration,
            planned_procedure: appointment.planned_procedure,
            notes: appointment.notes,
            branch_id: this.selectedPractice.branch_id
        }, 
        {headers}).pipe(
        catchError(this.handleError)
      );
  }

  deleteAppointment(appointmentData: any){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    let notify_patient_via = []; 
    let notify_doctor_via = []; 
    if(appointmentData.notifyPatient.sms){
      notify_patient_via.push('SMS')
    }
    if(appointmentData.notifyPatient.email){
      notify_patient_via.push('EMAIL')
    }
    if(appointmentData.notifyDoctor.sms){
      notify_doctor_via.push('SMS')
    }
    if(appointmentData.notifyDoctor.email){
      notify_doctor_via.push('EMAIL')
    }
    return this.http.post<any>(`${this.baseUrl}/deleteAppointment`,
      {
          status: appointmentData.deletePermanently ? "Deleted": "Cancelled",
          id: appointmentData.appointmentId,
          reason: appointmentData.reason,
          notify_doctor_via: notify_doctor_via.toString(),
          notify_patient_via: notify_patient_via.toString()
      }, 
      {headers}).pipe(
      catchError(this.handleError)
    );

  }
  
  private handleError(error: HttpErrorResponse) {
    return throwError(() => error.message || 'Server error');
  }

}