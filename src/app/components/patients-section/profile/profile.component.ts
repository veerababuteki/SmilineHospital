import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from '../../../services/message.service';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { SfcListComponent } from './sfc-list/sfc-list.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [ CommonModule, SfcListComponent ]
})
export class ProfileComponent implements OnInit {
  patientId: string | null | undefined;
  uniqueCode: string | null | undefined;
  patientDetails: any;
  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      if(this.patientId == null) {
        this.patientId = params.get('id');
      }
      if (this.patientId) {
        //this.loadPatientData(this.patientId);
      }
    });
    this.route.paramMap.subscribe(params => {
      if(this.uniqueCode == null) {
        this.uniqueCode = params.get('source');
      }
      if (this.uniqueCode) {
        this.loadPatientData(this.uniqueCode);
      }
    });
  }
  constructor(private messageService: MessageService, private userService: UserService, private router: Router, private route: ActivatedRoute) {}
    navigateToProfile() {
  }

  loadPatientData(patientId: string){
    this.userService.getUserProfile(patientId).subscribe(res =>{
      this.patientDetails = res.data;
    })
  }
  sendMessage() {
    if(this.patientId !== null && this.patientId !== undefined){
      this.messageService.sendMessage(this.patientId);
      this.router.navigate(['/patients', this.patientId, 'edit-profile', this.uniqueCode]);
    }
  }
}