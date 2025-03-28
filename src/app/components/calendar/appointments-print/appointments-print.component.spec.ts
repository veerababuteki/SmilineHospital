import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentsPrintComponent } from './appointments-print.component';

describe('AppointmentsPrintComponent', () => {
  let component: AppointmentsPrintComponent;
  let fixture: ComponentFixture<AppointmentsPrintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentsPrintComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppointmentsPrintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
