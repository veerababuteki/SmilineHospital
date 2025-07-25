import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService } from '../../../services/file.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PatientDataService } from '../../../services/patient-data.service';

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class FilesComponent implements OnInit {
  labels: any[] = [];
  selectedFiles: File[] = [];
  selectedLabelId: number | null = null;
  addLabel: boolean = false;
  newLabel: string = '';
  file_label_id: any;
  files: any[] = [];
  patientId: string | null | undefined;
  selectedFileIds: any[] = [];
  uploadProgress: number = 0;
  uniqueCode: string | null | undefined;
  previewModalOpen: boolean = false;
  currentPreviewFile: any = null;
  safeFileUrl: SafeResourceUrl | null = null;

  filesDict: Record<string, any[]> = {};

  constructor(
    private fileService: FileService,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private sanitizer: DomSanitizer,
    private patientDataService: PatientDataService
  ) {}

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe((params) => {
      this.patientId = params.get('id');
      if (this.patientId) {
        this.loadPatientData(this.patientId);
      }
    });

    this.route.paramMap.subscribe((params) => {
      this.uniqueCode = params.get('source');
    });

    this.patientDataService.data$.subscribe((data) => {
      if (data && data.files?.data?.rows) {
        this.files = data.files.data.rows.filter((f: any) => f.status !== 'Deleted');
        this.filesDict = this.groupByDate(this.files);
      }

      if (data && data.labels?.data) {
        this.labels = data.labels.data;
      } else {
        this.loadFileLabels();
      }
    });
  }

  loadFileLabels() {
    this.fileService.getFileLabels().subscribe((labels) => {
      this.labels = labels.data;
    });
  }

  loadPatientData(patientId: string) {
    this.fileService.getFileLabels().subscribe((labels) => {
      this.labels = labels.data;
    });

    this.fileService.getPatientFiles(Number(patientId)).subscribe((files) => {
      const existingData = this.patientDataService.getSnapshot();

      const updatedData = {
        ...existingData,
        files: files,
      };

      this.patientDataService.setData(updatedData);
    });
  }

  openFile(file: any, event: MouseEvent): void {
    const isCheckboxClick = (event.target as HTMLElement).tagName === 'INPUT';
    if (isCheckboxClick) return;

    this.currentPreviewFile = file;
    this.safeFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(file.file_path);

    if (this.isPdf(file.file_type)) {
      this.openPdfFile(file);
    } else if (this.isImage(file.file_type)) {
      this.openImageFile(file);
    } else if (this.isDocx(file.file_type)) {
      this.openDocxFile(file);
    } else {
      this.downloadFile(file);
    }
  }

  isImage(fileType: string): boolean {
    return !!fileType && fileType.startsWith('image/');
  }

  isPdf(fileType: string): boolean {
    return fileType === 'application/pdf';
  }

  isDocx(fileType: string): boolean {
    return (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword'
    );
  }

  openPdfFile(file: any): void {
    window.open(file.file_path, '_blank');
  }

  openImageFile(file: any): void {
    this.previewModalOpen = true;
  }

  openDocxFile(file: any): void {
    this.downloadFile(file);
  }

  downloadFile(file: any): void {
    const link = document.createElement('a');
    link.href = file.file_path;
    link.download = this.getFileName(file.file_path);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  closePreviewModal(): void {
    this.previewModalOpen = false;
    this.currentPreviewFile = null;
  }

  saveLabel() {
    if (this.newLabel.trim()) {
      this.fileService.saveFileLabel(this.newLabel).subscribe((res) => {
        console.log(res);
      });
    }
    this.addLabel = false;
    this.newLabel = '';
  }

  filterFiles(labelId: number) {
    if (labelId == 0) {
      this.selectedLabelId = null;
      this.filesDict = this.groupByDate(this.files);
    } else {
      this.selectedLabelId = labelId;
      this.filesDict = this.groupByDate(
        this.files.filter((f) => f.file_label_id == this.selectedLabelId)
      );
    }
  }

  onCheckboxChange(file: any, id: any) {
    if (file.isChecked) {
      this.selectedFileIds.push(id);
    } else {
      this.selectedFileIds = this.selectedFileIds.filter((item) => item !== id);
    }
  }

  groupByDate(rows: any[]) {
    return rows.reduce((acc, row) => {
      let dateKey = 'Unknown Date';
      if (row.created_at && typeof row.created_at === 'string' && row.created_at.includes('T')) {
        dateKey = row.created_at.split('T')[0];
      } else if (row.created_at) {
        dateKey = row.created_at;
      }

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }

      if (row.status === 'Completed') {
        row.isChecked = true;
      }

      acc[dateKey].push(row);
      return acc;
    }, {} as Record<string, any[]>);
  }

  getFileName(filePath: string): string {
    return filePath.split('/').pop() || 'Unknown';
  }

  deleteFiles() {
    this.selectedFileIds.forEach((id) => {
      this.fileService.deleteFile(id).subscribe((res) => {
        if (this.patientId) {
          this.loadPatientData(this.patientId);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'File deleted successfully.',
          });
        }
      });

      window.location.reload(); // Optional: Can be removed if reload is unnecessary
    });
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFiles = Array.from(files);
      this.uploadFiles();
    }
  }

  uploadFiles() {
    if (this.selectedFiles.length === 0) {
      alert('Please select files before uploading.');
      return;
    }

    if (!this.selectedLabelId) {
      this.selectedLabelId = this.labels[0]?.file_label_id;
    }

    if (!this.selectedLabelId) {
      alert('Please select a label before uploading.');
      return;
    }

    const formData = new FormData();

    this.selectedFiles.forEach((file) => {
      formData.append('images', file);
    });

    if (this.patientId !== undefined && this.patientId !== null) {
      formData.append('user_id', this.patientId);
    }

    formData.append('file_label_id', this.selectedLabelId.toString());
    formData.append('appointment_id', '10');

    this.fileService.saveFile(formData).subscribe({
      next: () => {
        if (this.patientId !== null && this.patientId !== undefined) {
          this.loadPatientData(this.patientId);
        }
        this.selectedFiles = [];
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Files uploaded successfully.',
        });
      },
      error: (err) => {
        console.error('Error uploading files:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'File upload failed.',
        });
      },
    });
  }
}
