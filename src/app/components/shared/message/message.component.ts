import { Component, OnInit } from '@angular/core';
import { MessageService, AppMessage } from '../../../services/message.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-message',
  standalone: true, // ✅ important
  imports: [CommonModule], // ✅ needed for *ngIf, ngClass
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit {
  visible = false;
  message: AppMessage | null = null;

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    this.messageService.message$.subscribe(msg => {
      this.message = msg;
      this.visible = true;
      setTimeout(() => {
        this.visible = false;
      }, 3000);
    });
  }
}
