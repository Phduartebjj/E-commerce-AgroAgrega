import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render icons for every catalog shortcut', () => {
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const links = host.querySelectorAll('.conteudo-do-menu .menu-link');
    const icons = host.querySelectorAll('.conteudo-do-menu .menu-icon');

    expect(links).toHaveLength(9);
    expect(icons).toHaveLength(9);
    expect(host.textContent).toContain('Cupons');
    expect(host.textContent).toContain('Agro+');
    expect(host.textContent).toContain('Ofertas');
  });
});
