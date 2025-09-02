import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SfcService } from '../../../../services/sfc.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SfcFormComponent } from '../../../../features/sfc/components/sfc-form/sfc-form.component';

@Component({
  selector: 'app-sfc-list',
  standalone: true,
  imports: [CommonModule, ToastModule, ButtonModule, DialogModule, SfcFormComponent],
  templateUrl: './sfc-list.component.html',
  styleUrls: ['./sfc-list.component.scss'],
  providers: [MessageService]
})
export class SfcListComponent implements OnInit {
  @Input() patientId: string = '';
  @Input() patientName: string = '';

  sfcMembers: any[] = [];
  loading: boolean = false;
  showAddSfcDialog: boolean = false;

  constructor(
    private sfcService: SfcService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    if (this.patientId) {
      this.loadSfcMembers();
    }
  }

  loadSfcMembers(): void {
    this.loading = true;
    this.sfcService.getSfcByPatientId(this.patientId).subscribe({
      next: (response) => {
        this.sfcMembers = response.data || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading SFC members:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load SFC members'
        });
        this.loading = false;
      }
    });
  }

  openAddSfcDialog(): void {
    this.showAddSfcDialog = true;
  }

  closeAddSfcDialog(): void {
    this.showAddSfcDialog = false;
    // Reload the list after adding new member
    this.loadSfcMembers();
  }

  getStatusBadgeClass(status: string): string {
    return status === 'Y' ? 'badge-success' : 'badge-secondary';
  }

  getStatusText(status: string): string {
    return status === 'Y' ? 'Smiline Patient' : 'Non-Smiline Patient';
  }
}
