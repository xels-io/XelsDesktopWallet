import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EthImportComponent } from './eth-import.component';

describe('EthImportComponent', () => {
  let component: EthImportComponent;
  let fixture: ComponentFixture<EthImportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EthImportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EthImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
