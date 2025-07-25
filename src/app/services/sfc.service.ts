import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SfcService {
  constructor(private http: HttpClient) {}

  submitSfcForm(data: any): Observable<any> {
    return this.http.post('/api/sfc', data); // Adjust endpoint to match your backend
  }

  getSfcEntries(): Observable<any[]> {
    return this.http.get<any[]>('/api/sfc');
  }
}
