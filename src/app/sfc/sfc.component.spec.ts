import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SfcComponent } from './sfc.component';

describe('SfcComponent', () => {
  let component: SfcComponent;
  let fixture: ComponentFixture<SfcComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SfcComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SfcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
