import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, Subject, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { options } from '@fullcalendar/core/preact.js';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = 'https://apis.idental.ai/api/v1';  // Replace with actual API
  loggedIn: boolean = false;

  private loadPatients = new Subject<void>();
  loadPatients$ = this.loadPatients.asObservable();

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}

  sendLoadPatients(){
    this.loadPatients.next();
  }

  getDoctors(docRoleID: any) {
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/auth/user/getExistingUser/${docRoleID}`, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  getPatient(code: any) {
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/auth/appointment/ProfileForAppointment/${code}`, {headers}).pipe(
        catchError(this.handleError)
      );
  }  

  getPatientByMobileNumber(code: any) {
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/getPersonByMobile/${code}`, {headers}).pipe(
        catchError(this.handleError)
      );
  }  


  getMedicalHistories(){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/admin/group/getAllMedicalHistory`, { headers});
  }

  getBranches(){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/admin/role/branches`, { headers});
  }

  getInsuranceGroups(){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/admin/group/getAllGroups`, { headers});
  }

  getCategories(){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.baseUrl}/admin/master/getAllCategories`, { headers});
  }

  addCategory(name: string){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const body = { name: name };

    return this.http.post<any>(`${this.baseUrl}/admin/master/addCategory`,{name: name}, {headers}).pipe(
        catchError(this.handleError)
      );
  }

  getUserProfile(code: string){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<any>(`${this.baseUrl}/auth/user/getProfile/${code}`, {headers}).pipe(
      catchError(this.handleError)
    );
  }

  updateUserProfile(patientDetails: any){
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.baseUrl}/auth/user/updateProfile`, {
      id: patientDetails.id,
        first_name: patientDetails.first_name,
        last_name: patientDetails.last_name,
        manual_unique_code: patientDetails.manual_unique_code,
        date_of_birth: patientDetails.date_of_birth,
        address: patientDetails.address,
        aadhaar_id: patientDetails.aadhaar_id,
        abhi_id: null,
        age: patientDetails.age,
        anniversary: null,
        referred_by: patientDetails.referred_by,
        referred_name: patientDetails.referred_name,
        referred_mobile: patientDetails.referred_mobile,
        blood_group: patientDetails.blood_group,
        family: null,
        gender: patientDetails.gender,
        phone: patientDetails.primary_mobile,
        secondary_mobile: patientDetails.secondary_mobile,
        langugae: patientDetails.langugae,
        land_line: patientDetails.land_line,
        street_address: patientDetails.street_address,
        locality: patientDetails.locality,
        city: patientDetails.city,
        pin_code: patientDetails.pin_code,
        profile: null,
        user_id: patientDetails.user_id
    }, {headers}).pipe(
      catchError(this.handleError)
    );
  }
  private handleError(error: HttpErrorResponse) {
    return throwError(() => error.message || 'Server error');
  }

}