import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { Router } from '@angular/router';
import { MessageService } from '../../../services/message.service';
import { DialogModule } from 'primeng/dialog';
import { AddProfileComponent } from '../edit-profile/add-profile.component';

export interface Patient {
    id: string;
    userId: number;
    name: string;
    email: string;
    phone: string;
    image?: string;
}

@Component({
  selector: 'app-patient-directory',
  templateUrl: './patient-directory.component.html',
  styleUrls: ['./patient-directory.component.scss'],
  imports: [FormsModule, CommonModule, DialogModule, AddProfileComponent]
})
export class PatientDirectoryComponent implements OnInit {
    patientId: string | null | undefined;
    allPatients: any[] = [];
    patients: any[] = [];
    displayAddPatientDialog = false;
    loadPaitentsSubscriber:any;
    constructor(private messageService: MessageService, private userService: UserService, private router: Router){
        this.userService.loadPatients$.subscribe(_=>{
            this.getPatients();
        })
    }

    ngOnInit() {
        this.getPatients();
    }

    filteredPatients: any[] = [];
    searchText: string = '';

    getPatients(){
        this.userService.getDoctors('2ac7787b-77d1-465b-9bc0-eee50933697f').subscribe(res => {
            this.allPatients = res.data; 
            this.allPatients.forEach(patient => {
                this.patients.push({
                    id: patient.unique_code,
                    userId: patient.user_id,
                    name: patient.first_name +' '+ patient.last_name,
                    email: patient.email,
                    phone: patient.phone,
                    image: 'assets/user.webp',
                    gender: patient.gender
                })
                this.filteredPatients = [...this.patients]
            })
        })
    }

    filterPatients() {
        const searchLower = this.searchText.toLowerCase();
        this.filteredPatients = this.patients.filter(patient =>
          patient.name.toLowerCase().includes(searchLower) ||
          patient.id.toLowerCase().includes(searchLower) ||
          patient.email.toLowerCase().includes(searchLower) ||
          patient.phone.includes(searchLower) ||
          patient.manual_unique_code.toLowerCase().includes(searchLower)

        );
      }

    navigateToProfile(patientId: number, uniqueCode: string) {
        this.messageService.sendMessage(patientId.toString(), uniqueCode);
        this.router.navigate(['/patients', patientId, 'profile', uniqueCode]);
    }
    showAddPatientDialog() {
        this.displayAddPatientDialog = true;
        
    }
    savePatient(event:any){
        // this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Patient Added Successfully' });
        this.displayAddPatientDialog = false;
        this.userService.getDoctors('2ac7787b-77d1-465b-9bc0-eee50933697f').subscribe(res => {
            this.allPatients = res.data; 
            this.allPatients.forEach(patient => {
                this.patients.push({
                    id: patient.unique_code,
                    userId: patient.user_id,
                    name: patient.first_name +' '+ patient.last_name,
                    email: patient.email,
                    phone: patient.phone,
                    image: 'assets/user.webp',
                    gender: patient.gender
                })
                this.filteredPatients = [...this.patients]
            })
        })
        this.router.navigate(['patients', event.user_id, 'profile', event.unique_code]);

    }

    hideAddPatientDialog() {
        this.displayAddPatientDialog = false;
    }
}