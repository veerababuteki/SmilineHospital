// custom-calendar.component.ts
import { Component, Input, Output, EventEmitter, OnInit, HostListener, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="calendar-container">
      <div class="date-input-wrapper" (click)="toggleCalendar()" #dateInputWrapper>
        <input
          type="text"
          [value]="displayDate"
          readonly
          [class.invalid-field]="isInvalid"
          class="date-input"
        />
        <div class="calendar-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" fill="white"/>
          </svg>
        </div>
      </div>

      <div class="calendar-dropdown" [class.show]="showCalendar" [style.left.px]="dropdownPosition.left" [style.top.px]="dropdownPosition.top">
        <div class="calendar-header">
          <button type="button" class="nav-button" (click)="previousMonth()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <h3 class="month-year">{{ currentMonth }} {{ currentYear }}</h3>
          <button type="button" class="nav-button" (click)="nextMonth()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <div class="calendar-grid">
          <div class="weekday-headers">
            <div class="weekday-header" *ngFor="let day of weekdays">{{ day }}</div>
          </div>
          
          <div class="calendar-dates">
            <button
              type="button"
              *ngFor="let date of calendarDates"
              class="date-cell"
              [class.other-month]="date.isOtherMonth"
              [class.today]="date.isToday"
              [class.selected]="date.isSelected"
              (click)="selectDate(date)"
            >
              {{ date.day }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./custom-calendar.component.scss']
})
export class CustomCalendarComponent implements OnInit, OnDestroy {
  @Input() selectedDate: string = '';
  @Input() isInvalid: boolean = false;
  @Output() dateSelected = new EventEmitter<string>();

  showCalendar = false;
  currentMonth = '';
  currentYear = 0;
  displayDate = '';
  calendarDates: CalendarDate[] = [];
  dropdownPosition = { left: 0, top: 0 };
  
  weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  private viewDate = new Date();
  private resizeListener?: () => void;
  private scrollListener?: () => void;

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    this.initializeCalendar();
    this.setupEventListeners();
  }

  ngOnDestroy() {
    this.removeEventListeners();
  }

  private setupEventListeners() {
    this.resizeListener = () => {
      if (this.showCalendar) {
        this.updateDropdownPosition();
      }
    };

    this.scrollListener = () => {
      if (this.showCalendar) {
        this.updateDropdownPosition();
      }
    };

    window.addEventListener('resize', this.resizeListener);
    window.addEventListener('scroll', this.scrollListener, true);
  }

  private removeEventListeners() {
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener, true);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showCalendar = false;
    }
  }

  initializeCalendar() {
    if (this.selectedDate) {
      // Parse DD-MM-YYYY format
      const dateParts = this.selectedDate.split('-');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(dateParts[2], 10);
        this.viewDate = new Date(year, month, day);
      } else {
        this.viewDate = new Date();
      }
      this.displayDate = this.selectedDate;
    } else {
      this.viewDate = new Date();
      this.displayDate = '';
    }
    
    this.currentMonth = this.months[this.viewDate.getMonth()];
    this.currentYear = this.viewDate.getFullYear();
    this.generateCalendar();
  }

  toggleCalendar() {
    this.showCalendar = !this.showCalendar;
    if (this.showCalendar) {
      // Update position when showing calendar
      setTimeout(() => {
        this.updateDropdownPosition();
      }, 0);
    }
  }

  private updateDropdownPosition() {
    const dateInputWrapper = this.elementRef.nativeElement.querySelector('.date-input-wrapper');
    if (dateInputWrapper) {
      const rect = dateInputWrapper.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownHeight = 400; // Approximate height of calendar dropdown
      const dropdownWidth = 320; // Minimum width of calendar dropdown

      let left = rect.left;
      let top = rect.bottom + 10;

      // Adjust horizontal position if dropdown would go off screen
      if (left + dropdownWidth > viewportWidth) {
        left = viewportWidth - dropdownWidth - 10;
      }
      if (left < 10) {
        left = 10;
      }

      // Adjust vertical position if dropdown would go off screen
      if (top + dropdownHeight > viewportHeight) {
        top = rect.top - dropdownHeight - 10;
      }
      if (top < 10) {
        top = 10;
      }

      this.dropdownPosition = { left, top };
    }
  }

  previousMonth() {
    this.viewDate.setMonth(this.viewDate.getMonth() - 1);
    this.currentMonth = this.months[this.viewDate.getMonth()];
    this.currentYear = this.viewDate.getFullYear();
    this.generateCalendar();
  }

  nextMonth() {
    this.viewDate.setMonth(this.viewDate.getMonth() + 1);
    this.currentMonth = this.months[this.viewDate.getMonth()];
    this.currentYear = this.viewDate.getFullYear();
    this.generateCalendar();
  }

  selectDate(date: CalendarDate) {
    if (date.isOtherMonth) {
      return;
    }

    const selectedDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), date.day);
    const formattedDate = this.formatDate(selectedDate);
    this.selectedDate = formattedDate;
    this.displayDate = formattedDate;
    this.dateSelected.emit(formattedDate);
    this.showCalendar = false;
    this.generateCalendar();
  }

  generateCalendar() {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const today = new Date();
    this.calendarDates = [];

    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const isOtherMonth = currentDate.getMonth() !== month;
      const isToday = currentDate.toDateString() === today.toDateString();
      let isSelected = false;
      
      if (this.selectedDate) {
        const dateParts = this.selectedDate.split('-');
        if (dateParts.length === 3) {
          const selectedDay = parseInt(dateParts[0], 10);
          const selectedMonth = parseInt(dateParts[1], 10) - 1;
          const selectedYear = parseInt(dateParts[2], 10);
          const selectedDateObj = new Date(selectedYear, selectedMonth, selectedDay);
          isSelected = currentDate.toDateString() === selectedDateObj.toDateString();
        }
      }

      this.calendarDates.push({
        day: currentDate.getDate(),
        date: currentDate,
        isOtherMonth,
        isToday,
        isSelected: !!isSelected
      });
    }
  }

  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
}

interface CalendarDate {
  day: number;
  date: Date;
  isOtherMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}