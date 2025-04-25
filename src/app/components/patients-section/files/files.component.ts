import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService } from '../../../services/file.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from '../../../services/message.service';

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule ]
})
export class FilesComponent implements OnInit {
    labels: any[] = [];
    selectedFiles: File[] = []; // Changed from single file to array of files
    selectedLabelId: number | null = null;
    addLabel: boolean = false;
    newLabel: string = '';
    file_label_id: any;
    files: any[] = [];
    patientId: string | null | undefined;
    selectedFileIds: any[] = [];
    uploadProgress: number = 0;
    uniqueCode: string | null | undefined;

    filesDict: Record<string, any[]> = {};
    
    ngOnInit(): void {
      this.route.parent?.paramMap.subscribe(params => {
        if(this.patientId == null) {
          this.patientId = params.get('id');
        }
        if (this.patientId) {
          this.loadPatientData(this.patientId);
        }
      });  
      this.route.paramMap.subscribe(params => {
        if(this.uniqueCode == null) {
          this.uniqueCode = params.get('source');
        }
        if(this.uniqueCode !== null){
          this.messageService.sendMessage(this.patientId ?? '', this.uniqueCode ?? '')
        }
      });
    }
    
    constructor(private fileService: FileService, private route: ActivatedRoute, private messageService:MessageService,){
    }
    
    loadPatientData(patientId: string) {
      this.fileService.getFileLabels().subscribe(labels => {
        this.labels = labels.data;
      });
      this.fileService.getPatientFiles(Number(patientId)).subscribe(files => {
        this.files = files.data.rows.filter((f: any) => f.status !== 'Deleted');
        this.filesDict = this.groupByDate(files.data.rows.filter((f: any) => f.status !== 'Deleted'));
      });
    }
    
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
      });
    }
    
    onFileSelected(event: any) {
      // Get all selected files as an array
      const files = event.target.files;
      if (files && files.length > 0) {
        // Convert FileList to array and store in selectedFiles
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
      
      // Append each file to the FormData with the same key 'images[]'
      this.selectedFiles.forEach((file, index) => {
        formData.append('images', file);
      });
      
      if (this.patientId !== undefined && this.patientId !== null) {
        formData.append('user_id', this.patientId);
      }
      
      formData.append('file_label_id', this.selectedLabelId.toString());
      formData.append('appointment_id', '10');
      
      // Optional: Log form data for debugging
      formData.forEach((value, key) => console.log(key, value));
      
      this.fileService.saveFile(formData).subscribe({
        next: (res) => {
          if (this.patientId !== null && this.patientId !== undefined) {
            this.loadPatientData(this.patientId);
          }
          // Reset selected files after successful upload
          this.selectedFiles = [];
        },
        error: (err) => {
          console.error('Error uploading files:', err);
        }
      });
    }
}