import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FileUploadService } from '../../../../services/file-upload.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
import { SignaturePadComponent } from '../../../shared/signature-pad/signature-pad.component';

interface ConsentFormData {
  id: string;
  patientName: string;
  doctorName: string;
  date: string;
  sections: {
    examination: boolean;
    treatmentPlan: boolean;
    drugs: boolean;
    anesthesia: boolean;
    fillings: boolean;
    crowns: boolean;
    dentures: boolean;
    rootCanal: boolean;
    periodontal: boolean;
    extraction: boolean;
    general: boolean;
  };
}

interface SignatureData {
  patientSignature?: string;
  doctorSignature?: string;
  timestamp: Date;
}

@Component({
  selector: 'app-consent-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DatePipe, ToastModule, SignaturePadComponent],
  providers: [MessageService],
  templateUrl: './consent-form.component.html',
  styleUrls: ['./consent-form.component.scss']
})
export class ConsentFormComponent implements OnInit {
  @Input() set treatment(value: any) {
    console.log('Treatment input setter called with:', value);
    this._treatment = value;
    if (value) {
      this.patchFormWithTreatmentData(value);
      // Load existing consent forms after treatment data is set
      if (this.userId && this.treatmentUniqueId) {
        this.loadExistingConsentForms();
      }
    }
  }
  get treatment(): any {
    return this._treatment;
  }
  private _treatment: any;

  @Input() viewOnly: boolean = false;

  @Output() closeDialog = new EventEmitter<void>();

  onDialogClosed() {
    this.uploadedForms = [];
  }

  consentForm!: FormGroup;
  selectedMode: string | null = null;
  uploadedForms: any[] = [];
  treatmentUniqueId: string = '';
  userId: string = '';
  isLoading: boolean = false;
  isLoadingExistingForms: boolean = false; // New property to track loading state
  hasLoadedExistingForms: boolean = false; // New property to track if we've attempted to load
  
  // Digital signature properties
  showSignatureMode: boolean = false;
  currentSignatures: SignatureData = { timestamp: new Date() };
  signatureHistory: SignatureData[] = [];
  showSignatureHistory: boolean = false;
  autoUploadSignedForm: boolean = true; // New property to control auto-upload

  sectionDescriptions: { [key: string]: { title: string; content: string } } = {
    examination: {
      title: 'EXAMINATION AND X-RAYS:',
      content: 'I understand that the initial visit may require radiographs in order to complete the examination, diagnosis, and treatment plan.'
    },
    treatmentPlan: {
      title: 'CHANGES IN TREATMENT PLAN:',
      content: 'I understand that, during treatment, it may be necessary to change or add procedures because of conditions found while working on teeth that were not discovered during examination-the most common being root canal therapy following routine restorative procedures. I give my permission to the Dentist to make any or all changes and additions to the treatment  plan as necessary.'
    },
    drugs: {
      title: 'DRUGS AND MEDICATION:',
      content: 'I understand that antibiotics, analgesics, and other medications can cause allergic reactions causing redness, swelling of tissues, pain itching, vomiting, and/or anaphylactic shock (severe allergic reaction). They may cause drowsiness and lack of awareness and coordination, which can be increased by the use of alcohol or other drugs. I understand that failure to take medications prescribed for me in the manner prescribed may offer risks of continued or aggravated infection, pain, and potential resistance to affect the treatment of my condition.'
    },
    anesthesia: {
      title: 'ADMINISTRATION OF LOCAL ANESTHESIA:',
      content: 'I understand that local anesthesia is a safe mode of controlling pain during dental procedures which involve tooth preparation, root canal treatment, tooth removal or any other dental surgical procedures. However, I understand that the administration of local anesthesia and its performance carries certain risks, hazards, and unpleasant side effects which are infrequent, but nonetheless may occur. They include, but are not limited to the following: 1. Nerve damage or paresthesia. 2. A temporary, increased heart rate and/or a flushed feeling 3. Allergic reaction. 4. Hematoma or swelling near or at the injection site. 5. Trismus or difficulty opening jaw after the injection. 6. Facial paralysis. 7.Soft tissue damage after the dental procedure due to biting of tongue and cheek, or burning tissues with hot food or beverage while still numb 8. Infection 9. Sloughing of tissue. 10. Needle breakage'
    },
    fillings: {
      title: 'FILLINGS:',
      content: 'I understand that care must be exercised in chewing on filling during the first 24 hours to avoid breakage, and tooth sensitivity is common after-effect of a newly placed filling. I understand more extensive filling or even a root canal may be required due to additional decay, which get disclosed while cleaning the cavity. I understand that over a period of time, the composite fillings, because of mouth fluids, different foods eaten, smoking, etc. may cause the shade to change. Also due to extreme chewing forces or other traumatic factors, it is possible for composite resin fillings or bonded aesthetic restorations to be displaced or fractured. The resin-enamel bond may fail, resulting in leakage and recurrent decay. Though the dentist has no control over these factors but early detection can save the tooth from further damage.'
    },
    crowns: {
      title: 'CROWNS, BRIDGES, VENEERS:',
      content: 'I understand that in order to replace a decayed, traumatized or a missing teeth, it is necessary to modify the existing tooth or the bridge supporting teeth so that crowns or bridges may be placed upon them. Tooth preparation will be done as conservatively as practical to achieve optimum esthetics and structural durability of the crown or bridge. Often after the preparation of the teeth for reception of the crown or bridges, the teeth may exhibit mild sensitivity for short period of time, which eventually subsides without any further interventions. rarely, if the teeth remain too sensitive for long periods of time following crowning, root canal treatment may be necessary. I further understand that I may be wearing temporary crowns, which may come off easily and that I must be careful to ensure that they are kept on until the permanent crowns are delivered. I understand that sometimes it is not possible to match the color of natural teeth exactly with artificial teeth. Also the final opportunity to make changes in my new crowns, bridge or cap (including shape, fit, size, placement, and color) will be done before cementation. I understand that in very few cases, cosmetic procedures may result in the need for future root canal treatment, which cannot always be predicted or anticipated. I understand that cosmetic procedures may affect tooth surfaces and may require modification of daily cleaning procedures. I understand that it is my responsibility to follow all instructions, including scheduling and attending all appointments. failure to keep the cementation appointment can result in ultimate failure of the crown/ Bridge to fit properly and an additional fee may be assessed.'
    },
    dentures: {
      title: 'DENTURES - COMPLETE OR PARTIAL:',
      content: ' I realize that full or partial dentures are artificial, constructed of plastic, metal and or porcelain. The problems of wearing those appliances have been explained to me including looseness, soreness, and possible breakage. I realize the final opportunity to make changes in my new denture (including shape, fit, size, placement, and color) will be "teeth in wax" try-in visit. I understand that dentures might become looser when there are changes in the supporting gum tissues which may require relining at a later date. The cost for this procedure is not the Initial denture fee. I understand that failure to keep up with my delivery appointment may result in poorly fitted dentures. If any remake is required due to my delays, there will be additional charges. I understand that it is my responsibility to seek attention when problems occur and do not lessen in a reasonable amount of time; also, to be examined regularly to evaluate the dentures, condition of the gums, and the general oral health. No guarantees or promises have been made to me concerning the results relating to my ability to utilize artificial dentures successfully nor to their longevity'
    },
    rootCanal: {
      title: 'ROOT CANAL TREATMENT:',
      content: 'I realize there is no guarantee that root canal therapy will save my tooth, and that complications can occur from the treatment. Occasionally root canal filling material may extend through the tooth which does not necessarily effect the success of the treatment. I understand that endodontic files are very fine instruments and stresses from their manufacture can cause them to separate during use, which may in judgement of the doctor be left in the treated root canal or require additional surgery. I understand that occasionally additional surgical procedures may be necessary following root canal treatment (apicoectomy). I understand that the tooth may be lost in spite of all efforts to save it. Successful completion of the root canal procedure does not prevent future decay or fracture. The root canal treated tooth will be more brittle and may discolor, a crown and/or post filling is recommended to prevent fracture and/or improve esthetics after completion of root canal.'
    },
    periodontal: {
      title: 'PERIODONTAL TREATMENT:',
      content: 'I understand that serious periodontal conditions causing gum inflammation and/or bone loss can lead to the loss of my teeth. I understand that treatment plans (non-surgical cleaning, gum surgery and/or extractions) may vary depending on the severity of periodontal conditions. I understand the success of a treatment depends in part on my efforts to brush and floss daily, receive regular cleaning as directed, following a healthy diet, avoid tobacco products and follow other recommendations.'
    },
    extraction: {
      title: 'REMOVAL OF TEETH (EXTRACTION):',
      content: 'I understand that if a tooth is not savable by e.g. root canal therapy, crowns, periodontal surgery, etc., it may be recommended that the tooth be extracted. I authorize dentist to remove the following teeth and any others necessary for reasons in paragraph #31 understand removing teeth does not always remove all infection if present and it may be necessary to have further treatment. I understand that the following are some risks involved in having teeth removed: pain, swelling, and spread of infection, dry socket, loss of feeling in my teeth, lips, tongue, and surrounding tissue (paresthesia) that can last for an indefinite period of time or fractured jaw. I understand the absolute necessity to follow the post extraction instructions including the one to avoid alcohol and smoking following extraction for healing purpose. I understand I may need further treatment by a specialist or even hospitalization if complications arise during or following treatment, the cost of which is my responsibility.'
    },
    general: {
      title: 'GENERAL:',
      content: `I understand that dentistry is not an exact science and therefore, reputable practitioners cannot properly guarantee results. I hereby authorize any of the doctors to proceed with and perform the dental restorations and treatments as explained to me. I understand that this is only an estimate and subject to modification depending on unforeseen or undiagnosable circumstances that may arise during the course of treatment. I understand that I am responsible for payment of the dental fees. I agree to pay any attorney's fees, or court costs, that may be incurred to satisfy this obligation.`
    }
  };

  constructor(
    private fb: FormBuilder,
    private fileUploadService: FileUploadService,
    private messageService: MessageService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    console.log('Consent form ngOnInit - treatment input:', this.treatment);
    this.createConsentForm();
    // Initialize uploadedForms as empty array
    this.uploadedForms = [];
    this.loadCurrentUser();
    
    // If view-only mode, automatically show upload section to display existing forms
    if (this.viewOnly) {
      this.selectedMode = 'upload';
    }
  }

  @Input() setTreatmentData(treatment: any): void {
    this.patchFormWithTreatmentData(treatment);
  }

  patchFormWithTreatmentData(treatment: any): void {
    console.log('Patching form with treatment data:', treatment);
    
    this.consentForm.patchValue({
      patientName: treatment?.patientName || '',
      doctorName: treatment?.doctorName || '',
      date: treatment?.date || new Date().toISOString().split('T')[0]
    });
    
    // Set the treatment unique ID for file uploads
    this.treatmentUniqueId = treatment?.treatmentUniqueId || '';
    console.log('Set treatmentUniqueId to:', this.treatmentUniqueId);
  }

  loadCurrentUser(): void {
    console.log('Loading current user...');
    this.authService.getUser().subscribe({
      next: (response) => {
        console.log('User response:', response);
        if (response && response.data && response.data.user_id) {
          this.userId = response.data.user_id;
          console.log('Set userId to:', this.userId);
          // Load existing consent forms if treatment data is already available
          if (this.treatmentUniqueId) {
            this.loadExistingConsentForms();
          }
        } else {
          console.error('No user_id found in response:', response);
        }
      },
      error: (error) => {
        console.error('Error loading current user:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load user information.'
        });
      }
    });
  }

  createConsentForm(): void {
    this.consentForm = this.fb.group({
      id: [this.generateId()],
      patientName: ['', Validators.required],
      doctorName: ['', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      sections: this.fb.group({
        examination: [false],
        treatmentPlan: [false],
        drugs: [false],
        anesthesia: [false],
        fillings: [false],
        crowns: [false],
        dentures: [false],
        rootCanal: [false],
        periodontal: [false],
        extraction: [false],
        general: [true]  // Set general section as selected by default
      })
    });
  }



  goBack(): void {
    this.selectedMode = null;
  }

  generateId(): string {
    return 'form_' + Math.random().toString(36).substr(2, 9);
  }



  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.uploadedForms.push({
        name: file.name,
        file: file,
        uploadDate: new Date()
      });
      
      // Reset the file input
      event.target.value = '';
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please select a valid PDF file.'
      });
    }
  }

  removeUploadedForm(index: number): void {
    this.uploadedForms.splice(index, 1);
  }

  getSectionKeys(): string[] {
    return Object.keys(this.sectionDescriptions);
  }

  isFormValid(): boolean {
    const formData = this.consentForm.value;
    return formData.patientName && formData.doctorName && formData.date;
  }

 async uploadConsentForms(): Promise<void> {
    const newFiles = this.uploadedForms.filter(form => form.file && !form.isExisting);
    
    if (newFiles.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please select files to upload.'
      });
      return;
    }

    // Validate file sizes and types
    const maxSizeInBytes = 20 * 1024 * 1024; // 20MB in bytes
    const invalidFiles = newFiles.filter(form => {
      const file = form.file;
      return file.size > maxSizeInBytes || file.type !== 'application/pdf';
    });

    if (invalidFiles.length > 0) {
      const oversizedFiles = invalidFiles.filter(form => form.file.size > maxSizeInBytes);
      const nonPdfFiles = invalidFiles.filter(form => form.file.type !== 'application/pdf');
      
      let errorMessage = '';
      if (oversizedFiles.length > 0) {
        const fileNames = oversizedFiles.map(form => form.file.name).join(', ');
        errorMessage += `File(s) exceed 10MB limit: ${fileNames}. `;
      }
      if (nonPdfFiles.length > 0) {
        const fileNames = nonPdfFiles.map(form => form.file.name).join(', ');
        errorMessage += `Only PDF files are allowed: ${fileNames}.`;
      }

      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Files',
        detail: errorMessage.trim()
      });
      return;
    }

    console.log('Current userId:', this.userId);
    console.log('Current treatmentUniqueId:', this.treatmentUniqueId);
    console.log('Current treatment data:', this.treatment);

    if (!this.userId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'User ID not available. Please try again.'
      });
      return;
    }

    if (!this.treatmentUniqueId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Treatment ID not available. Please try again.'
      });
      return;
    }

    console.log('Uploading with userId:', this.userId, 'treatmentUniqueId:', this.treatmentUniqueId);

    this.isLoading = true;
    try {
      const files = newFiles.map(form => form.file);
      
      if (files.length === 1) {
        await firstValueFrom(this.fileUploadService.uploadConsentForm(
          files[0], 
          this.userId, 
          this.treatmentUniqueId
        ));
      } else if (files.length > 1) {
        await firstValueFrom(this.fileUploadService.uploadMultipleConsentForms(
          files, 
          this.userId, 
          this.treatmentUniqueId
        ));
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Consent forms uploaded successfully!'
      });
      // Remove the uploaded files from the list
      this.uploadedForms = this.uploadedForms.filter(form => form.isExisting);
      this.loadExistingConsentForms(); // Reload the list
    } catch (error) {
      console.error('Upload error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to upload consent forms. Please try again.'
      });
    } finally {
      this.isLoading = false;
    }
  }

  loadExistingConsentForms(): void {
    console.log('loadExistingConsentForms called with treatmentUniqueId:', this.treatmentUniqueId);
    if (!this.treatmentUniqueId) {
      console.log('No treatmentUniqueId available, skipping load');
      this.hasLoadedExistingForms = true; // Mark as attempted even if no ID
      return;
    }

    console.log('Calling API to get consent forms for treatment:', this.treatmentUniqueId);
    this.isLoadingExistingForms = true;
    this.fileUploadService.getConsentFormsByTreatment(this.treatmentUniqueId)
      .subscribe({
        next: (response) => {
          console.log('API response for consent forms:', response);
          if (response && response.data && response.data.rows) {
            const existingFiles = response.data.rows.map((file: any) => ({
              id: file.id,
              name: file.file_path ? file.file_path.split('/').pop() || 'Unknown file' : 'Unknown file',
              file_path: file.file_path,
              uploadDate: new Date(file.created_at),
              isExisting: true
            }));
            console.log('Mapped existing files:', existingFiles);
            // Merge with any new files that haven't been uploaded yet
            const newFiles = this.uploadedForms.filter(f => !f.isExisting);
            this.uploadedForms = [...existingFiles, ...newFiles];
            console.log('Final uploadedForms array:', this.uploadedForms);
          } else {
            console.log('No existing files found in response');
            this.uploadedForms = this.uploadedForms.filter(f => !f.isExisting);
          }
          this.isLoadingExistingForms = false;
          this.hasLoadedExistingForms = true;
        },
        error: (error) => {
          console.error('Error loading consent forms:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load existing consent forms.'
          });
          this.isLoadingExistingForms = false;
          this.hasLoadedExistingForms = true;
        }
      });
  }

  async deleteConsentForm(fileId: string): Promise<void> {
    try {
      await firstValueFrom(this.fileUploadService.deleteConsentForm(fileId));
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Consent form deleted successfully!'
      });
      this.loadExistingConsentForms(); // Reload the list
    } catch (error) {
      console.error('Delete error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete consent form. Please try again.'
      });
    }
  }

  downloadConsentForm(filePath: string, fileName: string): void {
    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = filePath;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getNewFilesCount(): number {
    return this.uploadedForms.filter(f => !f.isExisting).length;
  }

  // New method to check if there are existing consent forms
  hasExistingConsentForms(): boolean {
    return this.uploadedForms.filter(f => f.isExisting).length > 0;
  }

  // New method to show the no consent message
  shouldShowNoConsentMessage(): boolean {
    return this.viewOnly && 
           this.selectedMode === 'upload' && 
           !this.isLoadingExistingForms && 
           this.hasLoadedExistingForms && 
           !this.hasExistingConsentForms();
  }

  // Digital signature methods
  selectMode(mode: string): void {
    this.selectedMode = mode;
    if (mode === 'download') {
      this.showSignatureMode = false;
    }
  }

  requestSignaturesAndDownload(): void {
    this.showSignatureMode = true;
  }

  openSignatureMode(): void {
    this.showSignatureMode = true;
  }

  closeSignatureMode(): void {
    this.showSignatureMode = false;
    this.currentSignatures = { timestamp: new Date() };
    // Reset auto-upload to default for next session
    this.autoUploadSignedForm = true;
  }

  async onPatientSignatureChange(signatureData: string | null): Promise<void> {
    if (signatureData) {
      // Compress the signature to reduce file size
      this.currentSignatures.patientSignature = await this.compressSignatureImage(signatureData);
    } else {
      this.currentSignatures.patientSignature = undefined;
    }
  }

  async onDoctorSignatureChange(signatureData: string | null): Promise<void> {
    if (signatureData) {
      // Compress the signature to reduce file size
      this.currentSignatures.doctorSignature = await this.compressSignatureImage(signatureData);
    } else {
      this.currentSignatures.doctorSignature = undefined;
    }
  }

  saveSignatures(): void {
    if (this.currentSignatures.patientSignature || this.currentSignatures.doctorSignature) {
      this.signatureHistory.push({
        ...this.currentSignatures,
        timestamp: new Date()
      });
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Signatures saved successfully!'
      });
      this.closeSignatureMode();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please add at least one signature before saving.'
      });
    }
  }

  async saveSignaturesAndDownload(): Promise<void> {
    if (this.currentSignatures.patientSignature || this.currentSignatures.doctorSignature) {
      // Save signatures first
      this.signatureHistory.push({
        ...this.currentSignatures,
        timestamp: new Date()
      });
      
      // Show success message
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Signatures saved! Generating signed form...'
      });
      
      try {
        // Generate the signed form as a blob
        const signedFormBlob = await this.generateSignedFormAsBlob();
        
        if (this.autoUploadSignedForm) {
          // Auto-upload the signed form
          await this.autoUploadSignedFormToServer(signedFormBlob);
        } else {
          // Download the signed form
          await this.downloadFormWithCurrentSignatures();
        }
        
        // Close the signature modal after completion
        this.closeSignatureMode();
      } catch (error) {
        console.error('Error processing signed form:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to process signed form. Please try again.'
        });
      }
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please add at least one signature before saving.'
      });
    }
  }

  removeSignature(index: number): void {
    this.signatureHistory.splice(index, 1);
  }

  async downloadFormAsPDF(): Promise<void> {
    const formData = this.consentForm.value;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageHeight = pdf.internal.pageSize.height;
    let yPosition = 20;

    // Header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INFORMED CONSENT FORM', 105, yPosition, { align: 'center' });
    yPosition += 15;

    // Basic Information
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Patient Name: ${formData.patientName}`, 20, yPosition);
    pdf.text(`Date: ${formData.date}`, 150, yPosition);
    yPosition += 10;
    pdf.text(`Doctor Name: ${formData.doctorName}`, 20, yPosition);
    yPosition += 15;

    // Selected Sections
    Object.keys(formData.sections).forEach(sectionKey => {
      if (formData.sections[sectionKey]) {
        const section = this.sectionDescriptions[sectionKey];
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(section.title, 20, yPosition);
        yPosition += 8;
        
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(section.content, 170);
        pdf.text(lines, 20, yPosition);
        yPosition += lines.length * 5 + 10;
        
        // Add signature areas
        pdf.text('Patient Signature: ____________________', 20, yPosition);
        pdf.text("Doctor's Signature: ____________________", 120, yPosition);
        yPosition += 15;
      }
    });

    pdf.save(`consent-form-${formData.patientName || 'patient'}-${formData.date}.pdf`);
  }

  async downloadFormWithSignatures(): Promise<void> {
    if (this.signatureHistory.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please add signatures before downloading the form.'
      });
      return;
    }

    try {
      // Get the latest signature (most recent one)
      const latestSignature = this.signatureHistory[this.signatureHistory.length - 1];
      
      // Create a temporary div to render the form with signatures
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      
      document.body.appendChild(tempDiv);

      // Generate HTML content with signatures
      const formData = this.consentForm.value;
      let htmlContent = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 18px; font-weight: bold;">INFORMED CONSENT FORM</h1>
        </div>
        <div style="margin-bottom: 15px;">
          <p><strong>Patient Name:</strong> ${formData.patientName}</p>
          <p><strong>Doctor Name:</strong> ${formData.doctorName}</p>
          <p><strong>Date:</strong> ${formData.date}</p>
        </div>
      `;

      // Add selected sections
      Object.keys(formData.sections).forEach(sectionKey => {
        if (formData.sections[sectionKey]) {
          const section = this.sectionDescriptions[sectionKey];
          htmlContent += `
            <div style="margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">${section.title}</h3>
              <p style="margin: 0 0 15px 0; text-align: justify;">${section.content}</p>
              <div style="display: flex; justify-content: space-between; margin-top: 20px;">
                <div style="flex: 1; margin-right: 20px;">
                  <p style="margin: 0 0 5px 0;"><strong>Patient Signature:</strong></p>
                  <div style="border-bottom: 1px solid #000; height: 60px; display: flex; align-items: center; justify-content: center;">
                    ${this.getSignatureImageHTML(latestSignature?.patientSignature)}
                  </div>
                </div>
                <div style="flex: 1;">
                  <p style="margin: 0 0 5px 0;"><strong>Doctor's Signature:</strong></p>
                  <div style="border-bottom: 1px solid #000; height: 60px; display: flex; align-items: center; justify-content: center;">
                    ${this.getSignatureImageHTML(latestSignature?.doctorSignature)}
                  </div>
                </div>
              </div>
            </div>
          `;
        }
      });

      tempDiv.innerHTML = htmlContent;

      // Convert to canvas and then to PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`consent-form-signed-${formData.patientName || 'patient'}-${formData.date}.pdf`);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Signed consent form downloaded successfully!'
      });

    } catch (error) {
      console.error('Error generating PDF with signatures:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to generate PDF with signatures. Please try again.'
      });
    }
  }

  private getSignatureImageHTML(signatureData: string | undefined): string {
    if (signatureData) {
      // Display signature with better styling for visibility
      return `<img src="${signatureData}" style="max-width: 100%; max-height: 60px; object-fit: contain; image-rendering: auto; border: 1px solid #ddd; background: white;" />`;
    }
    return '<span style="color: #999; font-style: italic;">No signature</span>';
  }

  // Enhanced method to compress signature images while maintaining visibility
  private async compressSignatureImage(signatureDataUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Moderate reduction in dimensions to maintain signature quality
        const maxWidth = 150;  // Increased from 120 for better visibility
        const maxHeight = 75;  // Increased from 60 for better visibility
        let { width, height } = img as HTMLImageElement;
        
        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Set white background for signatures to ensure visibility
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // Draw image with smoothing enabled for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Use PNG format to preserve signature quality and avoid black boxes
        // PNG is better for signatures as it preserves the drawing quality
        const compressedDataUrl = canvas.toDataURL('image/png');
        resolve(compressedDataUrl);
      };
      img.src = signatureDataUrl;
    });
  }

  async downloadFormWithCurrentSignatures(): Promise<void> {
    try {
      const signedFormBlob = await this.generateSignedFormAsBlob();
      this.downloadBlobAsFile(signedFormBlob, `consent-form-signed-${this.consentForm.value.patientName || 'patient'}-${this.consentForm.value.date}.pdf`);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Signed consent form downloaded successfully!'
      });

    } catch (error) {
      console.error('Error generating PDF with signatures:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to generate PDF with signatures. Please try again.'
      });
    }
  }

  hasSignatures(): boolean {
    return this.signatureHistory.length > 0;
  }

  getLatestSignatures(): SignatureData | null {
    return this.signatureHistory.length > 0 ? this.signatureHistory[this.signatureHistory.length - 1] : null;
  }

  // Advanced compression method for further file size reduction
  private async compressImageData(imageDataUrl: string, quality: number = 0.7): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Reduce dimensions by 20% for additional compression
        canvas.width = img.width * 0.8;
        canvas.height = img.height * 0.8;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = imageDataUrl;
    });
  }

  // New method to generate signed form as blob with advanced compression
  private async generateSignedFormAsBlob(): Promise<Blob> {
    // Create a temporary div to render the form with signatures
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '800px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '12px';
    tempDiv.style.lineHeight = '1.4';
    
    document.body.appendChild(tempDiv);

    // Generate HTML content with current signatures
    const formData = this.consentForm.value;
    let htmlContent = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 18px; font-weight: bold;">INFORMED CONSENT FORM</h1>
      </div>
      <div style="margin-bottom: 15px;">
        <p><strong>Patient Name:</strong> ${formData.patientName}</p>
        <p><strong>Doctor Name:</strong> ${formData.doctorName}</p>
        <p><strong>Date:</strong> ${formData.date}</p>
      </div>
    `;

    // Add selected sections
    Object.keys(formData.sections).forEach(sectionKey => {
      if (formData.sections[sectionKey]) {
        const section = this.sectionDescriptions[sectionKey];
        htmlContent += `
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">${section.title}</h3>
            <p style="margin: 0 0 15px 0; text-align: justify;">${section.content}</p>
            <div style="display: flex; justify-content: space-between; margin-top: 20px;">
              <div style="flex: 1; margin-right: 20px;">
                <p style="margin: 0 0 5px 0;"><strong>Patient Signature:</strong></p>
                <div style="border-bottom: 1px solid #000; height: 60px; display: flex; align-items: center; justify-content: center;">
                  ${this.getSignatureImageHTML(this.currentSignatures.patientSignature)}
                </div>
              </div>
              <div style="flex: 1;">
                <p style="margin: 0 0 5px 0;"><strong>Doctor's Signature:</strong></p>
                <div style="border-bottom: 1px solid #000; height: 60px; display: flex: align-items: center; justify-content: center;">
                  ${this.getSignatureImageHTML(this.currentSignatures.doctorSignature)}
                </div>
              </div>
            </div>
          </div>
        `;
      }
    });

    tempDiv.innerHTML = htmlContent;

    // Convert to canvas and then to PDF with balanced settings for quality and file size
    const canvas = await html2canvas(tempDiv, {
      scale: 1.2, // Slightly increased from 1.0 to ensure signature visibility
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      imageTimeout: 0,
      removeContainer: true,
      logging: false, // Disable logging for better performance
      width: 800, // Fixed width to control output size
      height: undefined, // Let height be calculated automatically
      scrollX: 0,
      scrollY: 0
    });

    document.body.removeChild(tempDiv);

    // Use JPEG compression for the main image to significantly reduce file size
    const imgData = canvas.toDataURL('image/jpeg', 0.8); // 80% quality for good balance
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Use JPEG format instead of PNG for much smaller file size
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Convert PDF to blob with additional compression
    const pdfDataUrl = pdf.output('dataurlstring');
    
    // Convert data URL to blob
    const response = await fetch(pdfDataUrl);
    const pdfBlob = await response.blob();
    
    // Apply additional compression if file is still too large (but be less aggressive)
    const fileSizeMB = pdfBlob.size / (1024 * 1024);
    if (fileSizeMB > 3) { // Increased threshold from 2MB to 3MB to preserve quality
      console.log(`PDF size before additional compression: ${fileSizeMB.toFixed(2)}MB`);
      
      // Re-generate with moderate compression to maintain signature quality
      const compressedImgData = await this.compressImageData(imgData, 0.75); // Higher quality than before
      const compressedPdf = new jsPDF('p', 'mm', 'a4');
      
      compressedPdf.addImage(compressedImgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      
      const compressedPdfDataUrl = compressedPdf.output('dataurlstring');
      const compressedResponse = await fetch(compressedPdfDataUrl);
      const compressedPdfBlob = await compressedResponse.blob();
      
      const compressedSizeMB = compressedPdfBlob.size / (1024 * 1024);
      console.log(`PDF size after additional compression: ${compressedSizeMB.toFixed(2)}MB`);
      
      return compressedPdfBlob;
    }
    
    return pdfBlob;
  }

  // New method to auto-upload signed form with enhanced file size management
  private async autoUploadSignedFormToServer(signedFormBlob: Blob): Promise<void> {
    try {
      // Check file size before upload (typical server limit is 10MB)
      const fileSizeMB = signedFormBlob.size / (1024 * 1024);
      
      // Show file size information to user
      if (fileSizeMB > 1) {
        this.messageService.add({
          severity: 'info',
          summary: 'File Size Optimized',
          detail: `Generated PDF size: ${fileSizeMB.toFixed(1)}MB (optimized for smaller file size)`
        });
      }
      
      if (fileSizeMB > 10) {
        this.messageService.add({
          severity: 'warn',
          summary: 'File Too Large',
          detail: `Generated PDF is ${fileSizeMB.toFixed(1)}MB. Server limit is 10MB. Falling back to download.`
        });
        // Fallback to download if file is too large
        this.downloadBlobAsFile(signedFormBlob, `consent-form-signed-${this.consentForm.value.patientName || 'patient'}-${this.consentForm.value.date}.pdf`);
        return;
      }

      // Create a File object from the blob
      const fileName = `consent-form-signed-${this.consentForm.value.patientName || 'patient'}-${this.consentForm.value.date}.pdf`;
      const signedFormFile = new File([signedFormBlob], fileName, { type: 'application/pdf' });

      // Upload the signed form
      this.isLoading = true;
      const result = await firstValueFrom(
        this.fileUploadService.uploadConsentForm(signedFormFile, this.userId, this.treatmentUniqueId)
      ).catch(error => {
        // Handle HTTP errors
        console.error('HTTP error during upload:', error);
        throw error;
      });

      // Debug: Log the API response to understand the structure
      console.log('Upload API response:', result);

      // Check for successful upload - handle different response formats
      // Success can be indicated by: result.success === true, result.status === 'success', 
      // result.data.success === true, or simply having a result object without error
      const isSuccess = result && (
        result.success === true || 
        result.status === 'success' || 
        (result.data && result.data.success === true) ||
        (result.status === 200) ||
        (result.statusCode === 200) ||
        // If we have a result object and no explicit error, consider it successful
        (!result.error && !result.message?.toLowerCase().includes('error') && !result.message?.toLowerCase().includes('fail'))
      );

      if (isSuccess) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Signed consent form uploaded successfully!'
        });
        
        // Reload existing consent forms to show the newly uploaded one
        this.loadExistingConsentForms();
      } else {
        // Only throw error if we have a clear failure indication
        const errorMessage = result?.message || result?.error || 'Upload failed';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error auto-uploading signed form:', error);
      
      // Check if it's a file size error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('413') || errorMessage.includes('Request Entity Too Large')) {
        this.messageService.add({
          severity: 'error',
          summary: 'File Too Large',
          detail: 'Generated PDF is too large for server upload. Please try with simpler signatures or contact support.'
        });
      } else if (errorMessage.includes('Upload failed') || errorMessage.includes('failed')) {
        this.messageService.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: 'Failed to auto-upload signed form. Please try manual upload.'
        });
      } else {
        // For other errors, show a more generic message
        this.messageService.add({
          severity: 'warn',
          summary: 'Upload Issue',
          detail: 'Auto-upload encountered an issue. The file has been downloaded instead.'
        });
      }
      
      // Fallback to download if auto-upload fails
      this.downloadBlobAsFile(signedFormBlob, `consent-form-signed-${this.consentForm.value.patientName || 'patient'}-${this.consentForm.value.date}.pdf`);
    } finally {
      this.isLoading = false;
    }
  }

  // Helper method to download blob as file
  private downloadBlobAsFile(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

}