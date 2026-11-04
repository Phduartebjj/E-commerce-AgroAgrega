import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutUsComponent } from './about-us';

// Verifica se o componente institucional da aplicação é criado corretamente.
describe('AboutUsComponent', () => {
  let component: AboutUsComponent;
  let fixture: ComponentFixture<AboutUsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutUsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutUsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
