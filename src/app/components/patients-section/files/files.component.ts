import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService } from '../../../services/file.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from '../../../services/message.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PatientDataService } from '../../../services/patient-data.service';

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule ]
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
      this.route.parent?.paramMap.subscribe(params => {
        this.patientId = params.get('id');
      });

      this.route.paramMap.subscribe(params => {
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
      this.fileService.getFileLabels().subscribe(labels => {
      this.labels = labels.data;
      });
    }
    
    loadPatientData(patientId: string) {
      this.fileService.getFileLabels().subscribe(labels => {
        this.labels = labels.data;
      });
      this.fileService.getPatientFiles(Number(patientId)).subscribe(files => {
        const existingData = this.patientDataService.getSnapshot();

        const updatedData = {
          ...existingData,
          files: files
        };

        this.patientDataService.setData(updatedData);
      });
    }

    // New method to open different file types
    openFile(file: any, event: MouseEvent): void {
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
    openPdfFile(file: any): void {
      window.open(file.file_path, '_blank');
    }
    
    // Open image file in a modal or lightbox
    openImageFile(file: any): void {
      this.previewModalOpen = true;
      // You would need to add a modal component to your HTML to show the image
    }
    
    // Open docx file
    openDocxFile(file: any): void {
      // For Word documents, it's usually best to just download them
      // as browsers can't display them natively
      this.downloadFile(file);
    }
    
    // Download the file
    downloadFile(file: any): void {
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
    
    // Existing methods below this line
    saveLabel(){
      if(this.newLabel.trim()){
        this.fileService.saveFileLabel(this.newLabel).subscribe(res => {
          console.log(res);
        });
      }
      this.addLabel = false;
      this.newLabel = '';
    }

    filterFiles(labelId: number){
      if(labelId == 0){
        this.selectedLabelId = null;
        this.filesDict = this.groupByDate(this.files);
      }
      else{
        this.selectedLabelId = labelId;
        this.filesDict = this.groupByDate(this.files.filter(f => f.file_label_id == this.selectedLabelId));
      }
    }
    
    onCheckboxChange(file: any, id: any){
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

    groupByDate(rows: any[]) {
      return rows.reduce((acc, row) => {
        const dateKey = row.created_at.split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        if(row.status == 'Completed'){
          row.isChecked = true;
        }
        acc[dateKey].push(row);
        return acc;
      }, {} as Record<string, any[]>);
    }
    
    getFileName(filePath: string): string {
      return filePath.split('/').pop() || 'Unknown';
    }
    
    deleteFiles(){
      this.selectedFileIds.forEach(id => {
        this.fileService.deleteFile(id).subscribe(res => {
          if(this.patientId){
            this.loadPatientData(this.patientId);
          }
        });
        window.location.reload();
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
      
      this.selectedFiles.forEach((file, index) => {
        formData.append('images', file);
      });
      
      if (this.patientId !== undefined && this.patientId !== null) {
        formData.append('user_id', this.patientId);
      }
      
      formData.append('file_label_id', this.selectedLabelId.toString());
      formData.append('appointment_id', '10');
      
      formData.forEach((value, key) => console.log(key, value));
      
      this.fileService.saveFile(formData).subscribe({
        next: (res) => {
          if (this.patientId !== null && this.patientId !== undefined) {
            this.loadPatientData(this.patientId);
          }
          this.selectedFiles = [];
        },
        error: (err) => {
          console.error('Error uploading files:', err);
        }
      });
    }
}