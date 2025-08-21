import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../Env/environment';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  // private baseUrl = 'http://localhost:7001/api/v1/auth';
  // private baseUrl = 'https://apis.idental.ai/api/v1/auth';
  private baseUrl = `${environment.baseUrl}/auth`;
  

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Upload single consent form for treatment
  uploadConsentForm(file: File, userId: string, treatmentUniqueId: string): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('user_id', userId);
    formData.append('treatment_unique_id', treatmentUniqueId);

    return this.http.post(
      `${this.baseUrl}/file/addTreatmentFile`,
      formData,
      { headers: this.getHeaders() }
    );
  }

  // Upload multiple consent forms for treatment
  uploadMultipleConsentForms(files: File[], userId: string, treatmentUniqueId: string): Observable<any> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    formData.append('user_id', userId);
    formData.append('treatment_unique_id', treatmentUniqueId);

    return this.http.post(
      `${this.baseUrl}/file/addTreatmentFiles`,
      formData,
      { headers: this.getHeaders() }
    );
  }

  // Get all consent forms for a treatment
  getConsentFormsByTreatment(treatmentUniqueId: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/file/getFilesByTreatment/${treatmentUniqueId}`,
      { headers: this.getHeaders() }
    );
  }

  // Delete a consent form
  deleteConsentForm(fileId: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/file/deleteFilesData/${fileId}`,
      {},
      { headers: this.getHeaders() }
    );
  }
} 