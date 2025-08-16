import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TimelineService } from '../../../services/timeline.service';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class TimelineComponent implements OnInit {
  patientId: string | null | undefined;
  timeline: Record<string, any[]> = {};
  allTimelineData: any[] = []; // Store all data before filtering
  
  // Define filter types
  filterTypes = {
    Appointment: true,
    FileUpload: true,
    VitalSigns: true,
    ClinicalNotes: true,
    TreatmentPlan: true,
    Procedure: true,
    Invoice: true,
    Payment: true
  };

  constructor(private route: ActivatedRoute, private timelineService: TimelineService) {}

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

  loadPatientData(patientId: string) {
    this.timelineService.getPatientTimeline(Number(patientId)).subscribe(res => {
      this.allTimelineData = res.data; // Store all data
      this.applyFilters(); // Apply initial filters
    });
  }

  // Method to select all filters
  selectAll(): void {
    Object.keys(this.filterTypes).forEach(key => {
      this.filterTypes[key as keyof typeof this.filterTypes] = true;
    });
    this.applyFilters();
  }

  // Method to deselect all filters
  deselectAll(): void {
    Object.keys(this.filterTypes).forEach(key => {
      this.filterTypes[key as keyof typeof this.filterTypes] = false;
    });
    this.applyFilters();
  }

  // Apply filters and regenerate timeline
  applyFilters() {
    // Get list of selected types
    const selectedTypes = Object.keys(this.filterTypes).filter(
      key => this.filterTypes[key as keyof typeof this.filterTypes]
    );

    // Filter the data based on selected types
    const filteredData = this.allTimelineData.filter(item => 
      selectedTypes.includes(item.type)
    );

    // Regenerate timeline with filtered data
    this.timeline = this.groupByDate(filteredData);
  }

  // Check if any filter is selected
  hasAnyFilter(): boolean {
    return Object.values(this.filterTypes).some(value => value);
  }

  // Check if all filters are selected
  areAllSelected(): boolean {
    return Object.values(this.filterTypes).every(value => value);
  }

  groupByDate(rows: any[]) {
    const grouped = rows.reduce((acc, row) => {
      var dateKey = '';
      if(row.type === 'Appointment'){
        dateKey = row.appointment_date;
      }
      else{
        dateKey = row.created_at.split('T')[0];
      }
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(row);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.fromEntries(
      Object.entries(grouped).sort(([dateA], [dateB]) => {
        const timestampA = new Date(dateA).getTime();
        const timestampB = new Date(dateB).getTime();
        return timestampB - timestampA;
      })
    ) as Record<string, any[]>;
  }

  getSortedDates(): string[] {
    return Object.keys(this.timeline).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  }

  // Check if timeline has events
  hasEvents(): boolean {
    return Object.keys(this.timeline).length > 0;
  }


  hasAnyClinicalData(item: any): boolean {
  return (
    (item.chief_complaints && item.chief_complaints.trim()) ||
    (item.observations && item.observations.trim()) ||
    (item.investigations && item.investigations.trim()) ||
    (item.diagnoses && item.diagnoses.trim()) ||
    (item.notes && item.notes.trim())
  );
}
}