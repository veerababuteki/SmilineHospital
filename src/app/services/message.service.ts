// import { Injectable } from '@angular/core';
// import { Subject } from 'rxjs';
// interface Message {
//   text: string;
//   code: string;
// }
// @Injectable({
//   providedIn: 'root',
// })
// export class MessageService {
//   private messageSource = new Subject<Message>();
//   message$ = this.messageSource.asObservable();

//   sendMessage(message: string, uniqueCode: string = '') {
//     this.messageSource.next({
//       text: message,
//       code: uniqueCode
//     });
//   }
// }




import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

// ✅ Renamed to avoid conflict with PrimeNG's Message
export interface AppMessage {
  text: string;
  code: string;
  type?: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private messageSource = new Subject<AppMessage>();
  message$ = this.messageSource.asObservable();

  sendMessage(text: string, code = '', type: 'success' | 'error' | 'info' = 'success') {
    this.messageSource.next({ text, code, type });
  }
}
