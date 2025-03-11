import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';

interface TimeSlot {
  startDate: FormControl<Date | null>;
  startTime: FormControl<string | null>;
  endDate: FormControl<Date | null>;
  endTime: FormControl<string | null>;
}

interface DropdownOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-availability',
  templateUrl: './availability.component.html',
  styleUrls: ['./availability.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CalendarModule,
    DropdownModule,
    ButtonModule,
    RadioButtonModule,
    InputNumberModule,
  ]
})
export class AvailabilityComponent implements OnInit {
  timeSlots: TimeSlot[] = [];
  today: Date = new Date();
  
  // Time options for dropdowns
  timeOptions: DropdownOption[] = this.generateTimeOptions();
  
  // Repeat configuration
  repeatConfig = new FormControl('no-repeat');
  repeatOptions: DropdownOption[] = [
    { label: 'Does not repeat', value: 'no-repeat' },
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Custom', value: 'custom' }
  ];
  
  // Additional repeat configuration controls
  repeatFrequency = new FormControl(1);
  endType = new FormControl('never');
  endDate = new FormControl<Date | null>(null);
  occurrences = new FormControl(1);

  ngOnInit() {
    this.addNewSlot();
  }

  addNewSlot() {
    const today = new Date();
    const newSlot: TimeSlot = {
      startDate: new FormControl<Date | null>(today),
      startTime: new FormControl('05:00'),
      endDate: new FormControl<Date | null>(today),
      endTime: new FormControl('05:00')
    };
    this.timeSlots.push(newSlot);
  }

  removeSlot(index: number) {
    this.timeSlots.splice(index, 1);
  }

  updateEndDate(index: number) {
    const slot = this.timeSlots[index];
    const startDate = slot.startDate.value;
    if (startDate) {
      slot.endDate.setValue(new Date(startDate));
    }
  }

  getMinDate(date: Date | null): Date {
    return date ? new Date(date) : new Date();
  }

  onRepeatChange(event: any) {
    if (event.value === 'no-repeat') {
      this.endType.setValue('never');
      this.repeatFrequency.setValue(1);
    }
  }

  getFrequencyLabel(): string {
    switch (this.repeatConfig.value) {
      case 'daily':
        return 'days';
      case 'weekly':
        return 'weeks';
      case 'monthly':
        return 'months';
      default:
        return 'days';
    }
  }

  private generateTimeOptions(): DropdownOption[] {
    const times: DropdownOption[] = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      times.push({ 
        label: `${hour}:00`, 
        value: `${hour}:00` 
      });
      times.push({ 
        label: `${hour}:30`, 
        value: `${hour}:30` 
      });
    }
    return times;
  }
}