// consent-form.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ConsentFormData {
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
  patientSignature: string;
  doctorSignature: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadedForm {
  id: string;
  name: string;
  data: string;
  uploadDate: Date;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConsentFormService {
  private formsSubject = new BehaviorSubject<ConsentFormData[]>([]);
  private uploadedFormsSubject = new BehaviorSubject<UploadedForm[]>([]);

  forms$ = this.formsSubject.asObservable();
  uploadedForms$ = this.uploadedFormsSubject.asObservable();

  constructor() {
    this.loadFormsFromStorage();
    this.loadUploadedFormsFromStorage();
  }

  // Form Management
  addForm(formData: Partial<ConsentFormData>): string {
    const newForm: ConsentFormData = {
      id: this.generateId(),
      patientName: formData.patientName || '',
      doctorName: formData.doctorName || '',
      date: formData.date || new Date().toISOString().split('T')[0],
      sections: formData.sections || {
        examination: false,
        treatmentPlan: false,
        drugs: false,
        anesthesia: false,
        fillings: false,
        crowns: false,
        dentures: false,
        rootCanal: false,
        periodontal: false,
        extraction: false,
        general: false
      },
      patientSignature: formData.patientSignature || '',
      doctorSignature: formData.doctorSignature || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const currentForms = this.formsSubject.value;
    const updatedForms = [...currentForms, newForm];
    this.formsSubject.next(updatedForms);
    this.saveFormsToStorage(updatedForms);
    
    return newForm.id;
  }

  updateForm(id: string, formData: Partial<ConsentFormData>): void {
    const currentForms = this.formsSubject.value;
    const updatedForms = currentForms.map(form => 
      form.id === id 
        ? { 
            ...form, 
            ...formData, 
            updatedAt: new Date() 
          }
        : form
    );
    
    this.formsSubject.next(updatedForms);
    this.saveFormsToStorage(updatedForms);
  }

  deleteForm(id: string): void {
    const currentForms = this.formsSubject.value;
    const updatedForms = currentForms.filter(form => form.id !== id);
    this.formsSubject.next(updatedForms);
    this.saveFormsToStorage(updatedForms);
  }

  getForm(id: string): ConsentFormData | undefined {
    return this.formsSubject.value.find(form => form.id === id);
  }

  getAllForms(): ConsentFormData[] {
    return this.formsSubject.value;
  }

  // Uploaded Forms Management
  addUploadedForm(file: File, data: string): string {
    const uploadedForm: UploadedForm = {
      id: this.generateId(),
      name: file.name,
      data: data,
      uploadDate: new Date(),
      size: file.size
    };

    const currentUploaded = this.uploadedFormsSubject.value;
    const updatedUploaded = [...currentUploaded, uploadedForm];
    this.uploadedFormsSubject.next(updatedUploaded);
    this.saveUploadedFormsToStorage(updatedUploaded);
    
    return uploadedForm.id;
  }

  deleteUploadedForm(id: string): void {
    const currentUploaded = this.uploadedFormsSubject.value;
    const updatedUploaded = currentUploaded.filter(form => form.id !== id);
    this.uploadedFormsSubject.next(updatedUploaded);
    this.saveUploadedFormsToStorage(updatedUploaded);
  }

  getAllUploadedForms(): UploadedForm[] {
    return this.uploadedFormsSubject.value;
  }

  // Validation
  validateForm(formData: ConsentFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!formData.patientName?.trim()) {
      errors.push('Patient name is required');
    }

    if (!formData.doctorName?.trim()) {
      errors.push('Doctor name is required');
    }

    if (!formData.date) {
      errors.push('Date is required');
    }

    const hasSelectedSections = Object.values(formData.sections).some(selected => selected);
    if (!hasSelectedSections) {
      errors.push('At least one section must be selected');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Statistics
  getFormStatistics(): {
    totalForms: number;
    completedForms: number;
    incompleteForms: number;
    totalUploadedForms: number;
    mostUsedSections: string[];
  } {
    const forms = this.formsSubject.value;
    const uploadedForms = this.uploadedFormsSubject.value;
    
    const completedForms = forms.filter(form => 
      this.validateForm(form).isValid && 
      form.patientSignature && 
      form.doctorSignature
    ).length;

    // Count section usage
    const sectionCounts: Record<string, number> = {};
    forms.forEach(form => {
      Object.entries(form.sections).forEach(([section, selected]) => {
        if (selected) {
          sectionCounts[section] = (sectionCounts[section] || 0) + 1;
        }
      });
    });

    const mostUsedSections = Object.entries(sectionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([section]) => section);

    return {
      totalForms: forms.length,
      completedForms,
      incompleteForms: forms.length - completedForms,
      totalUploadedForms: uploadedForms.length,
      mostUsedSections
    };
  }

  // Utility Methods
  private generateId(): string {
    return 'form_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private saveFormsToStorage(forms: ConsentFormData[]): void {
    try {
      localStorage.setItem('consentForms', JSON.stringify(forms));
    } catch (error) {
      console.error('Error saving forms to localStorage:', error);
    }
  }

  private loadFormsFromStorage(): void {
    try {
      const stored = localStorage.getItem('consentForms');
      if (stored) {
        const forms = JSON.parse(stored);
        this.formsSubject.next(forms);
      }
    } catch (error) {
      console.error('Error loading forms from localStorage:', error);
    }
  }

  private saveUploadedFormsToStorage(forms: UploadedForm[]): void {
    try {
      localStorage.setItem('uploadedForms', JSON.stringify(forms));
    } catch (error) {
      console.error('Error saving uploaded forms to localStorage:', error);
    }
  }

  private loadUploadedFormsFromStorage(): void {
    try {
      const stored = localStorage.getItem('uploadedForms');
      if (stored) {
        const forms = JSON.parse(stored);
        this.uploadedFormsSubject.next(forms);
      }
    } catch (error) {
      console.error('Error loading uploaded forms from localStorage:', error);
    }
  }

  // Export/Import functionality
  exportAllFormsAsJSON(): string {
    const allData = {
      forms: this.formsSubject.value,
      uploadedForms: this.uploadedFormsSubject.value,
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(allData, null, 2);
  }

  importFormsFromJSON(jsonData: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.forms && Array.isArray(data.forms)) {
        this.formsSubject.next(data.forms);
        this.saveFormsToStorage(data.forms);
      }
      
      if (data.uploadedForms && Array.isArray(data.uploadedForms)) {
        this.uploadedFormsSubject.next(data.uploadedForms);
        this.saveUploadedFormsToStorage(data.uploadedForms);
      }
      
      return { success: true, message: 'Forms imported successfully' };
    } catch (error) {
      return { success: false, message: 'Error importing forms: ' + (error as Error).message };
    }
  }

  // Clear all data
  clearAllData(): void {
    this.formsSubject.next([]);
    this.uploadedFormsSubject.next([]);
    localStorage.removeItem('consentForms');
    localStorage.removeItem('uploadedForms');
  }
}