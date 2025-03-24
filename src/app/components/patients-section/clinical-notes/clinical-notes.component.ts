import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClinicalNotesService } from '../../../services/clinical-notes.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClinicalNotesPrintComponent } from "./clinical-notes-print/clinical-notes-print.component";

@Component({
  selector: 'app-clinical-notes',
  templateUrl: './clinical-notes.component.html',
  styleUrls: ['./clinical-notes.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ClinicalNotesPrintComponent]
})

export class ClinicalNotesComponent implements OnInit {
  clinicalNotes: any[] = [];
  patientId: string | null | undefined;
  constructor(private clinicalNotesService: ClinicalNotesService, 
    private router: Router,
    private route: ActivatedRoute
  ){
    
  }  
  
  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      if(this.patientId == null) {
        this.patientId = params.get('id');
      }
      if (this.patientId) {
        this.loadPatientData(this.patientId);
      }
    });
  }
  
  loadPatientData(patientId: string){
    this.clinicalNotesService.getClinicalNotes(Number(patientId)).subscribe(res => {
      this.clinicalNotes = res.data.rows;
    })
  }

  navigateToAdd(){
    this.router.navigate(['/patients', this.patientId, 'add-clinical-note'])
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
