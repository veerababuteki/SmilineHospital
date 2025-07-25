import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SfcFormComponent } from './sfc-form.component';

describe('SfcFormComponent', () => {
  let component: SfcFormComponent;
  let fixture: ComponentFixture<SfcFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SfcFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SfcFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
