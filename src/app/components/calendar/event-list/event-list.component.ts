import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Overlay, OverlayModule, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { EventPopoverComponent } from '../event-popover/event-popover.component';
@Component({
  selector: 'app-event-list',
  imports:[CommonModule],
  template: `
    <div class="event-list">
      <h3>{{ formatDate(data.date) }}</h3>
      <div class="event-item" *ngFor="let event of data.events" (click)="showEventPopover(event, $event)"
           [ngClass]="'left-border-red'">
        <span *ngIf="isBlockCalendarEvent(event)">{{ getBlockTitle(event) }}</span>
        <span *ngIf="!isBlockCalendarEvent(event)">{{ event.extendedProps?.patientName }}</span>
      </div>
    </div>
  `,
  styles: [`
    .event-list {
      padding: 1rem;
      position: relative; // Add this
      z-index: 1000; // Add this
    }

    .event-items-container {
      position: relative;
      z-index: 1000;
    }

    .event-item {
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      background-color: #ffffff;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      cursor: pointer;
    }

    .left-border-red {
      border-left: 3px solid #ff0000;
    }

    .left-border-blue {
      border-left: 3px solid #0000ff;
    }

    .left-border-green {
      border-left: 3px solid #00ff00;
    }

    :host ::ng-deep .event-popover-overlay {
      z-index: 1001 !important; // Higher than the list
    }
  `]
})
export class EventListComponent {
  data: any;
  private overlayRef: OverlayRef | null = null;
  @Output() eventEmitted = new EventEmitter<any>();
  constructor(public config: DynamicDialogConfig, private overlay: Overlay, public ref: DynamicDialogRef) {
    this.data = config.data;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
 isBlockCalendarEvent(event: any): boolean {
    return event?.extendedProps?.type === 'block_calendar';
  }

  getBlockTitle(event: any): string {
    if (event.extendedProps?.doctorName && event.extendedProps.doctorName !== 'All Doctors') {
      return `Dr. ${event.extendedProps.doctorName} - Blocked`;
    }
    return 'Calendar Blocked';
  }
  
  showEventPopover(event: any, mouseEvent: MouseEvent) {
       // Prevent event bubbling
    mouseEvent.stopPropagation();
    
    // Close any existing popover
    this.closePopover();
    
    // Get the clicked element's position
    const targetElement = mouseEvent.currentTarget as HTMLElement;
    const targetRect = targetElement.getBoundingClientRect();
    
    // Create overlay position strategy
    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(targetElement)
      .withPositions([
        {
          originX: 'end',
          originY: 'center',
          overlayX: 'start',
          overlayY: 'center',
          offsetX: 16 // Space between list and popover
        },
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 8
        }
      ]);

    // Create overlay
    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'transparent-backdrop',
      panelClass: ['event-popover-overlay'], // Add this class for z-index
    });

    // Create and attach component
    const componentPortal = new ComponentPortal(EventPopoverComponent);
    const componentRef = this.overlayRef.attach(componentPortal);

    // Set component inputs and outputs
    componentRef.instance.event = event;
    componentRef.instance.close.subscribe(() => this.closePopover());
    componentRef.instance.edit.subscribe((evt) => this.handleEventEdit(evt));
    componentRef.instance.delete.subscribe((evt) => this.handleEventDelete(evt));

    // Close on backdrop click
    this.overlayRef.backdropClick().subscribe(() => this.closePopover());
    }
    emitEventBack(event: any) {
      this.ref.close(event);
    }
    private closePopover() {
      if (this.overlayRef) {
        this.overlayRef.dispose();
        this.overlayRef = null;
      }
    }
  
    private handleEventEdit(event: any) {
      // Implement your edit logic here
      this.emitEventBack(event);
    }
  
    private handleEventDelete(event: any) {
      // Implement your delete logic here
      console.log('Delete event:', event);
    }
}