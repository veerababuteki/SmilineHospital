import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PatientDataService {
  private dataSubject = new BehaviorSubject<any>(null);
  public data$ = this.dataSubject.asObservable();

  setData(data: any) {
    this.dataSubject.next(data);
  }

  getSnapshot() {
    return this.dataSubject.value;
  }

  clearData() {
    this.dataSubject.next(null);
  }
}