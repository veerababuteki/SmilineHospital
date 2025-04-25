import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClinicalNotesPrintComponent } from './clinical-notes-print.component';

describe('ClinicalNotesPrintComponent', () => {
  let component: ClinicalNotesPrintComponent;
  let fixture: ComponentFixture<ClinicalNotesPrintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClinicalNotesPrintComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClinicalNotesPrintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
