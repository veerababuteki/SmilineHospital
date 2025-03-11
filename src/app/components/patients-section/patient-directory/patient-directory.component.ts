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

    constructor(private messageService: MessageService, private userService: UserService, private router: Router){

    }

    ngOnInit() {
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
    filteredPatients: any[] = [];
    searchText: string = '';

    filterPatients() {
        const searchLower = this.searchText.toLowerCase();
        this.filteredPatients = this.patients.filter(patient =>
          patient.name.toLowerCase().includes(searchLower) ||
          patient.id.toLowerCase().includes(searchLower) ||
          patient.phone.includes(searchLower)
        );
      }

    navigateToProfile(patientId: number, uniqueCode: string) {
        this.messageService.sendMessage(patientId.toString(), uniqueCode);
        this.router.navigate(['/patients', patientId, 'profile', uniqueCode]);
    }
    showAddPatientDialog() {
        this.displayAddPatientDialog = true;
        
    }
    savePatient(){
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
    }

    hideAddPatientDialog() {
        this.displayAddPatientDialog = false;
    }
}