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

createBlockCalendar(blockData: any) {
  const savedPractice = localStorage.getItem('selectedPractice');
    if(savedPractice){
      this.selectedPractice = JSON.parse(savedPractice);
    }
  blockData.branch_id = this.selectedPractice.branch_id;
  return this.http.post(`${this.baseUrl}/createBlockCalendar`, blockData);
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
  
  // Update block calendar entry
  updateBlockCalendar(blockData: any) {
    return this.http.put<any>(`${this.baseUrl}/updateBlockCalendar`, blockData);
  }

  // Delete block calendar entry
  deleteBlockCalendar(blockId: string) {
    return this.http.delete<any>(`${this.baseUrl}/deleteBlockCalendar/${blockId}`);
  }

  
checkAppointmentConflict(params: {
    doctor_id?: string;
    appointment_date: string;
    appointment_time: string;
    booking_type: string;
    branch_id: number;
  }): Observable<any> {
    let httpParams = new HttpParams();
     const savedPractice = localStorage.getItem('selectedPractice');
    if(savedPractice){
      this.selectedPractice = JSON.parse(savedPractice);
    }
    if (params.doctor_id) {
      httpParams = httpParams.set('doctor_id', params.doctor_id);
    }
    httpParams = httpParams.set('appointment_date', params.appointment_date);
    httpParams = httpParams.set('appointment_time', params.appointment_time);
    httpParams = httpParams.set('booking_type', params.booking_type);
    httpParams = httpParams.set('branch_id', this.selectedPractice.branch_id.toString());

    return this.http.get(`${this.baseUrl}/checkAppointmentConflict`, { params: httpParams });
  }

  // Method to get block calendar by doctor and date range (alternative approach)
  getBlockCalendarByDoctor(doctorId: string, fromDate: string, toDate: string): Observable<any> {
    const params = new HttpParams()
      .set('doctor_id', doctorId)
      .set('from_date', fromDate)
      .set('to_date', toDate);

    return this.http.get(`${this.baseUrl}/getBlockCalendarByDoctor`, { params });
  }

  // Method to get all block calendars for a date range
  getBlockCalendarByDateRange(fromDate: string, toDate: string, branchId?: number): Observable<any> {
    const savedPractice = localStorage.getItem('selectedPractice');
    if(savedPractice){
      this.selectedPractice = JSON.parse(savedPractice);
    }
    let params = new HttpParams()
      .set('from_date', fromDate)
      .set('to_date', toDate);
    
      params = params.set('branch_id', this.selectedPractice.branch_id.toString());

    return this.http.get(`${this.baseUrl}/getBlockCalendarByDateRange`, { params });
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => error.message || 'Server error');
  }

}