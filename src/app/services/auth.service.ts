import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'https://apis.idental.ai/auth';  // Replace with actual API
  loggedIn: boolean = false;

  constructor(private http: HttpClient, private router: Router) {}

  isLoggedIn(): boolean {
    return this.loggedIn || JSON.parse(localStorage.getItem('isLoggedIn') || 'false');
  }

  setLoggedIn(value: boolean) {
    this.loggedIn = value;
    localStorage.setItem('isLoggedIn', JSON.stringify(value)); 
  }
  
  getUser(){
        const token = this.getAccessToken();
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
    return this.http.get<any>(`${this.baseUrl}/getCurrentUser`, {headers});
  }

  registerUser(patientDetails: any) {
    return this.http.post<any>(`${this.baseUrl}/register`, {
        first_name: patientDetails.first_name,
        last_name: '',
        manual_unique_code: patientDetails.manual_unique_code,
        date_of_birth: patientDetails.date_of_birth,
        address: patientDetails.address,
        aadhaar_id: patientDetails.aadhaar_id,
        password: patientDetails.phone.toString(),
        re_password: patientDetails.phone.toString(),
        email: patientDetails.email,
        abhi_id: null,
        age: patientDetails.age,
        anniversary: null,
        referred_by: patientDetails.referred_by,
        referred_name: patientDetails.referred_name,
        referred_mobile: patientDetails.referred_mobile,
        blood_group: patientDetails.blood_group,
        family: null,
        gender: patientDetails.gender,
        phone: patientDetails.phone,
        secondary_mobile: patientDetails.secondary_mobile,
        langugae: patientDetails.langugae,
        land_line: patientDetails.land_line,
        street_address: patientDetails.street_address,
        locality: patientDetails.locality,
        city: patientDetails.city,
        pin_code: patientDetails.pin_code,
        profile: null,
        medical_history: patientDetails.medical_history,
        groups_list: patientDetails.groups_list,
        other_history: patientDetails.other_history,
        role_id: '2ac7787b-77d1-465b-9bc0-eee50933697f'
    });
  }

  sendOTP(mobileNumber: any){
    return this.http.post<any>(`${this.baseUrl}/login`, {
        login_type: "otp",
        username: mobileNumber,
        password: ""
    });
  }

  verifyOTP(mobileNumber: any, otp: any){
    return this.http.post<any>(`${this.baseUrl}/verifyOtp`, {
        username: mobileNumber,
        otp: otp
    });
  }

  loginWithPassword(input: any, password:any){
    return this.http.post<any>(`${this.baseUrl}/login`, {
        login_type: "password",
        username: input,
        password: password
    });
  }

  createUserProfile(profileData: any) {
    return this.http.post<any>(`${this.baseUrl}/addProfile`, {
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      userId: profileData.userId,
      date_of_birth: profileData.dob,
      gender: profileData.gender,
      address: profileData.address
    });
  }

  storeTokens(response: any) {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('expiresAt', response.expiresAt);
    localStorage.setItem('refreshExpiresAt', response.refreshExpiresAt);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    const accessToken = localStorage.getItem('accessToken');
    const token = this.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token found'));
    }

    return this.http.post<any>(`${this.baseUrl}/refreshToken`, { 
      accessToken: accessToken,
      refreshToken:  refreshToken 
    }, {headers}).pipe(
      tap((response: any) => {
        this.storeTokens(response.data);
      }),
      catchError((error: any) => {
        this.logout();
        return throwError(() => error);
      })
    );
  }
  
  logout() {
    localStorage.clear();
    this.router.navigate(['/login']); // Redirect to login page
  }
}