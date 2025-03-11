import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService } from '../../../services/file.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss'],
  standalone: true,
  imports: [ CommonModule,FormsModule
  ]
})
export class FilesComponent implements OnInit {
    labels: any[] = [];
    selectedFile: File | null = null;
    selectedLabelId: number | null = null;
    addLabel: boolean = false;
    newLabel: string = '';
  file_label_id: any;
  files: any[] = [];
  patientId: string | null | undefined;
  selectedFileIds: any[] = [];

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
    }
    constructor(private fileService: FileService, private route: ActivatedRoute){
    }
    
    loadPatientData(patientId: string) {
      this.fileService.getFileLabels().subscribe(labels => {
        this.labels = labels.data;
      })
      this.fileService.getPatientFiles(Number(patientId)).subscribe(files => {
        this.files = files.data.rows.filter((f: any) => f.status !== 'Deleted')
        this.filesDict = this.groupByDate(files.data.rows.filter((f: any) => f.status !== 'Deleted'));
      });
    }
    saveLabel(){
      if(this.newLabel.trim()){
        this.fileService.saveFileLabel(this.newLabel).subscribe(res => {
          console.log(res)
        });
      }
      this.addLabel = false;
      this.newLabel = ''
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
        this.selectedFileIds.push(id)
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
          row.isChecked = true
        }
        acc[dateKey].push(row);
        return acc;
      }, {} as Record<string, any[]>);
    }
    
    getFileName(filePath: string): string {
      return filePath.split('/').pop() || 'Unknown';
    }
    deleteFiles(){
      this.selectedFileIds.forEach(id =>{
        this.fileService.deleteFile(id).subscribe(res=>{
          if(this.patientId){
            this.loadPatientData(this.patientId)
          }
        })
      })
    }
    onFileSelected(event: any) {
      const file = event.target.files[0]; // Get the first selected file
      if (file) {
        this.selectedFile = file;
        if (!this.selectedFile) {
          alert('Please select a file before uploading.');
          return;
        }
        if (!this.selectedLabelId) {
          this.selectedLabelId = this.labels[0].file_label_id;
        }
        var formData = new FormData();
        formData.append('image', this.selectedFile);
        if(this.patientId !== undefined && this.patientId !== null){
          formData.append('user_id', this.patientId);

        }
        if (!this.selectedLabelId) {
          return;
        }
        formData.append('file_label_id', this.selectedLabelId.toString());
        formData.append('appointment_id', '10');
        formData.append('file_type', this.selectedFile.type);
        formData.forEach((value, key) => console.log(key, value));

        this.fileService.saveFile(formData).subscribe(res=>{
        if(this.patientId !== null && this.patientId !== undefined){
          this.loadPatientData(this.patientId)
        }
        })
      }
    }
    
}