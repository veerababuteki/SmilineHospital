import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService } from '../../../services/file.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from '../../../services/message.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PatientDataService } from '../../../services/patient-data.service';

interface FileItem {
  id: number;
  file_path: string;
  file_type: string;
  created_at: string;
  status: string;
  file_label_id: number;
  isChecked?: boolean;
}

interface Label {
  file_label_id: number;
  name: string;
}

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule ]
})
export class FilesComponent implements OnInit {
    labels: Label[] = [];
    selectedFiles: File[] = [];
    selectedLabelId: number | null = null;
    addLabel: boolean = false;
    newLabel: string = '';
    file_label_id: any;
    files: FileItem[] = [];
    patientId: string | null | undefined;
    selectedFileIds: number[] = [];
    uploadProgress: number = 0;
    uniqueCode: string | null | undefined;
    previewModalOpen: boolean = false;
    currentPreviewFile: FileItem | null = null;
    safeFileUrl: SafeResourceUrl | null = null;

    filesDict: Record<string, FileItem[]> = {};
    
    constructor(
        private fileService: FileService, 
        private route: ActivatedRoute, 
        private messageService: MessageService,
        private sanitizer: DomSanitizer,
        private patientDataService: PatientDataService
    ) {}
    
    ngOnInit(): void {
      this.route.parent?.paramMap.subscribe(params => {
        this.patientId = params.get('id');
      });

      this.route.paramMap.subscribe(params => {
        this.uniqueCode = params.get('source');
      });

      this.patientDataService.data$.subscribe((data: any) => {
        if (data && data.files?.data?.rows) {
          this.files = data.files.data.rows.filter((f: FileItem) => f.status !== 'Deleted');
          this.filesDict = this.groupByDate(this.files);
        }
        if (data && data.labels?.data) {
          this.labels = data.labels.data;
        } else {
          this.loadFileLabels();
        }
      });
    }

    // this is functionality for sorting data by latest date
    dateDescOrder = (a: any, b: any): number => {
      const dateA = new Date(a.key).getTime();
      const dateB = new Date(b.key).getTime();
      return dateB - dateA; // latest first
    };

    loadFileLabels(): void {
      this.fileService.getFileLabels().subscribe((labels: any) => {
        this.labels = labels.data;
      });
    }
    
    loadPatientData(patientId: string): void {
      this.fileService.getFileLabels().subscribe((labels: any) => {
        this.labels = labels.data;
      });
      this.fileService.getPatientFiles(Number(patientId)).subscribe((files: any) => {
        const existingData = this.patientDataService.getSnapshot();

        const updatedData = {
          ...existingData,
          files: files
        };

        this.patientDataService.setData(updatedData);
      });
    }

    // New method to open different file types
    openFile(file: FileItem, event: MouseEvent): void {
      // Don't open the file if the checkbox was clicked
      const isCheckboxClick = (event.target as HTMLElement).tagName === 'INPUT';
      if (isCheckboxClick) return;

      // Set current file for preview
      this.currentPreviewFile = file;
      
      // Create a safe URL using the Angular sanitizer
      this.safeFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(file.file_path);
      
      // Open file based on its type
      if (this.isPdf(file.file_type)) {
        this.openPdfFile(file);
      } else if (this.isImage(file.file_type)) {
        this.openImageFile(file);
      } else if (this.isDocx(file.file_type)) {
        this.openDocxFile(file);
      } else {
        // For other file types, just download the file
        this.downloadFile(file);
      }
    }
    
    // Helper method to check if file is an image
    isImage(fileType: string): boolean {
      return !!fileType && fileType.startsWith('image/');
    }
    
    // Helper method to check if file is a docx/word document
    isDocx(fileType: string): boolean {
      return fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
             fileType === 'application/msword';
    }
    
    // Open PDF file in a new tab
    openPdfFile(file: FileItem): void {
      window.open(file.file_path, '_blank');
    }
    
    // Open image file in a modal or lightbox
    openImageFile(file: FileItem): void {
      this.previewModalOpen = true;
      // You would need to add a modal component to your HTML to show the image
    }
    
    // Open docx file
    openDocxFile(file: FileItem): void {
      // For Word documents, it's usually best to just download them
      // as browsers can't display them natively
      this.downloadFile(file);
    }
    
    // Download the file
    downloadFile(file: FileItem): void {
      const link = document.createElement('a');
      link.href = file.file_path;
      link.download = this.getFileName(file.file_path);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    // Close the preview modal
    closePreviewModal(): void {
      this.previewModalOpen = false;
      this.currentPreviewFile = null;
    }
    
    saveLabel(): void {
      if(this.newLabel.trim()){
        this.fileService.saveFileLabel(this.newLabel).subscribe((res: any) => {
          console.log(res);
        });
      }
      this.addLabel = false;
      this.newLabel = '';
    }

    filterFiles(labelId: number): void {
      let filteredFiles: FileItem[];
      
      if(labelId === 0){
        this.selectedLabelId = null;
        filteredFiles = this.files;
      } else {
        this.selectedLabelId = labelId;
        filteredFiles = this.files.filter(f => f.file_label_id === this.selectedLabelId);
      }
      
      // Apply the same sorting logic
      this.filesDict = this.groupByDate(filteredFiles);
    }
    
    onCheckboxChange(file: FileItem, id: number): void {
      if(file.isChecked){
        this.selectedFileIds.push(id);
      } else{
        this.selectedFileIds = this.selectedFileIds.filter(item => 
          item !== id
        );
      }
    }
    
    isPdf(fileType: string): boolean {
      return fileType === 'application/pdf';
    }

    groupByDate(rows: FileItem[]): Record<string, FileItem[]> {
      // First, group the files by date
      const grouped = rows.reduce((acc: Record<string, FileItem[]>, row: FileItem) => {
        const dateKey = row.created_at.split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        if(row.status === 'Completed'){
          row.isChecked = true;
        }
        acc[dateKey].push(row);
        return acc;
      }, {} as Record<string, FileItem[]>);

      // Sort each group's files by creation time (newest first within each date)
      Object.keys(grouped).forEach(dateKey => {
        grouped[dateKey].sort((a: FileItem, b: FileItem) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

      // Convert to array of [date, files] pairs, sort by date (newest first), then convert back to object
      const sortedEntries = Object.entries(grouped).sort(([a], [b]) => {
        return new Date(b).getTime() - new Date(a).getTime();
      });

      // Convert back to object with sorted order maintained
      const sortedGrouped: Record<string, FileItem[]> = {};
      sortedEntries.forEach(([date, files]) => {
        sortedGrouped[date] = files;
      });

      return sortedGrouped;
    }
    
    getFileName(filePath: string): string {
      return filePath.split('/').pop() || 'Unknown';
    }
    
    deleteFiles(): void {
      // Guard: must select at least one
      if (this.selectedFileIds.length === 0) {
        alert('Please select at least one file to delete.');
        return;
      }

      // Confirm with user
      const ok = confirm('Do you want to delete the selected file(s)?');
      if (!ok) return;

      // Delete all selected, then reload once all are done
      let remaining = this.selectedFileIds.length;
      this.selectedFileIds.forEach(id => {
        this.fileService.deleteFile(id).subscribe({
          next: () => {
            if (this.patientId) {
              this.loadPatientData(this.patientId);
            }
          },
          error: () => {
            // even on error, continue countdown so UI isn't stuck
          },
          complete: () => {
            remaining -= 1;
            if (remaining === 0) {
              window.location.reload();
            }
          }
        });
      });
    }
    
    onFileSelected(event: Event): void {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (files && files.length > 0) {
        this.selectedFiles = Array.from(files);
        this.uploadFiles();
      }
    }
    
    uploadFiles(): void {
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
      
      this.selectedFiles.forEach((file: File) => {
        formData.append('images', file);
      });
      
      if (this.patientId !== undefined && this.patientId !== null) {
        formData.append('user_id', this.patientId);
      }
      
      formData.append('file_label_id', this.selectedLabelId.toString());
      formData.append('appointment_id', '10');
      
      formData.forEach((value, key) => console.log(key, value));
      
      this.fileService.saveFile(formData).subscribe({
        next: (res: any) => {
          if (this.patientId !== null && this.patientId !== undefined) {
            this.loadPatientData(this.patientId);
          }
          this.selectedFiles = [];
        },
        error: (err: any) => {
          console.error('Error uploading files:', err);
        }
      });
    }
}