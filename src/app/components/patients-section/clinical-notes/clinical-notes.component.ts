import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClinicalNotesService } from '../../../services/clinical-notes.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClinicalNotesPrintComponent } from "./clinical-notes-print/clinical-notes-print.component";
import { MenuItem, MenuItemCommandEvent } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { MessageService } from '../../../services/message.service';
import { PatientDataService } from '../../../services/patient-data.service';

@Component({
  selector: 'app-clinical-notes',
  templateUrl: './clinical-notes.component.html',
  styleUrls: ['./clinical-notes.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ClinicalNotesPrintComponent, MenuModule, ButtonModule]
})

export class ClinicalNotesComponent implements OnInit {
  clinicalNotes: any[] = [];
  patientId: string | null | undefined;
  items: MenuItem[] = [];
  currentClinicalNotes: any;
  uniqueCode: string | null | undefined;

  constructor(private messageService: MessageService, private clinicalNotesService: ClinicalNotesService, 
    private router: Router,
    private route: ActivatedRoute, private patientDataService: PatientDataService,
    
  ){
    
  }  
  
  ngOnInit(): void {
    const routeId = this.route.parent?.snapshot.paramMap.get('id');
  const source = this.route.snapshot.paramMap.get('source');

  if (routeId && source) {
    this.patientId = routeId;
    this.uniqueCode = source;
  } else {
    const cached = localStorage.getItem('patientContext');
    if (cached) {
      const context = JSON.parse(cached);
      this.patientId = context.patientId;
      this.uniqueCode = context.uniqueCode;
    }
  }

  // Subscribe to shared data
  this.patientDataService.data$.subscribe((res) => {
    const clinicalNotes = res?.clinicalNotes?.data?.rows || [];
    this.clinicalNotes = clinicalNotes;
  });

    this.items = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: (event) => this.updateClinicalNotes(event)
      }
    ];
  }
  
  setCurrentClinicalNotes(event: any): void {
    // Update menu items with the current invoice key as data
    this.currentClinicalNotes = event
    this.items = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.updateClinicalNotes(this.currentClinicalNotes)
      },
      // {
      //   label: 'Cancel',
      //   icon: 'pi pi-times',
      //   command: () => this.cancelInvoice(this.currentInvoiceKey)
      // }
    ];
  }
  updateClinicalNotes(event: any): void {
    this.router.navigate(['/patients', this.patientId, 'add-clinical-note', this.uniqueCode], {
      state: { mode: 'edit', noteData: event }
    });
  }
  
  loadPatientData(patientId: string){
    this.clinicalNotesService.getClinicalNotes(Number(patientId)).subscribe(res => {
      this.clinicalNotes = res.data.rows;
    })
  }

  navigateToAdd(){
    this.router.navigate(['/patients', this.patientId, 'add-clinical-note', this.uniqueCode])
  }
  formatStringToArray(value: string){
    if (typeof value !== "string") {
      throw new Error("Invalid input: Not a string");
    }
    if(value === '') return
    let formatted = value.trim();
    let formattedA = formatted.split(',');

    return formattedA;
  } catch (error: any) {
    console.error("Error parsing string to array:", error);
    return []; // Return empty array on error
  }
  getSortedDates(): string[] {
    return Object.keys(this.clinicalNotes).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }
  }  
