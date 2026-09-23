import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Auth } from '@core/services/auth/auth.service';
import { Cart } from '@core/services/cart/cart.service';
import { ProductModel } from '@models/product';
import { Header } from './header';

// Verifica busca, atalhos, menu da conta e indicadores do cabeçalho.
describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        {
          provide: Auth,
          useValue: {
            isLoggedIn: () => true,
            getName: () => 'Gustavo Leite',
            getEmail: () => 'gustavo@example.com',
            getId: () => 'user-1',
            currentUserId: signal<string | null>('user-1'),
            logout: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should submit the pill search with the Buscar button or Enter', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const host = fixture.nativeElement as HTMLElement;
    const form = host.querySelector<HTMLFormElement>('form.area-busca');
    const input = host.querySelector<HTMLInputElement>('.campo-busca');
    const button = host.querySelector<HTMLButtonElement>('.botao-busca');

    expect(form?.getAttribute('role')).toBe('search');
    expect(button?.type).toBe('submit');
    expect(button?.textContent?.trim()).toBe('Buscar');
    expect(button?.querySelector('.botao-busca__wheat')).not.toBeNull();

    input!.value = '  sensor de umidade  ';
    const shouldSubmit = form!.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );

    expect(shouldSubmit).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/products'], {
      queryParams: { search: 'sensor de umidade' },
    });
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

  it('should open the account menu with identity and shortcuts', () => {
    component.toggleAccountMenu(new MouseEvent('click'));
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.account-dropdown')).not.toBeNull();
    expect(host.textContent).toContain('gustavo@example.com');
    expect(host.textContent).toContain('Compras e histórico');
    expect(host.textContent).toContain('Benefícios Agro+');
  });

  it('should show Compra before the cart without the old orders icon', () => {
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const actions = Array.from(host.querySelectorAll('.acoes-header > a'));

    expect(host.querySelector('.icone-pedidos')).toBeNull();
    expect(host.querySelector('.compra-link')?.textContent?.trim()).toBe('Compra');
    expect(actions[0]?.classList.contains('compra-link')).toBe(true);
    expect(actions[1]?.classList.contains('icone-carrinho')).toBe(true);
    expect(host.querySelector('.agro-cart-icon__basket')).not.toBeNull();
    expect(host.querySelectorAll('.agro-cart-icon__wheel')).toHaveLength(2);
    expect(host.querySelector('.agro-cart-icon__leaf')).not.toBeNull();
    expect(host.querySelector('.icone-carrinho img')).toBeNull();
  });

  it('should keep the cart quantity badge above the decorative leaf', () => {
    const cart = TestBed.inject(Cart);
    const product: ProductModel = {
      id: 'header-cart-test',
      title: 'Produto para teste do contador',
      price: 10,
      description: 'Produto de teste',
      category: 'Insumos',
      images: ['/assets/images/test.webp'],
      rating: 5,
    };

    cart.cleanCartItem();
    cart.addCartItem(product, 2);
    fixture.detectChanges();

    const counter = fixture.nativeElement.querySelector('.contador-carrinho') as HTMLElement;

    expect(counter.textContent?.trim()).toBe('2');
    expect(getComputedStyle(counter).zIndex).toBe('5');

    cart.cleanCartItem();
  });

  it('should keep the account actions and category navigation in the normal page flow', () => {
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const actions = host.querySelector('.acoes-header');
    const navigation = host.querySelector('.navegar-categorias');

    expect(actions?.classList.contains('acoes-header-fixas')).toBe(false);
    expect(navigation?.classList.contains('navegar-categorias-fixa')).toBe(false);
  });
});
