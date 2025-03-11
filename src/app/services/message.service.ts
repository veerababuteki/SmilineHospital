import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
interface Message {
  text: string;
  code: string;
}
@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private messageSource = new Subject<Message>();
  message$ = this.messageSource.asObservable();

  sendMessage(message: string, uniqueCode: string = '') {
    this.messageSource.next({
      text: message,
      code: uniqueCode
    });
  }
}
