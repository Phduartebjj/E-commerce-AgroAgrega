import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Benefits } from './benefits';

describe('Benefits', () => {
  let component: Benefits;
  let fixture: ComponentFixture<Benefits>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Benefits],
    }).compileComponents();

    fixture = TestBed.createComponent(Benefits);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
