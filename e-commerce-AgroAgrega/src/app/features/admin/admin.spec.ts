import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminComponent } from './admin';
import { ProductService } from '@core/services/product/product.service';
import { AuthAdminService } from '@core/services/auth/auth-admin.service';
import { vi } from 'vitest';

// Verifica a criação da área administrativa e a alteração de senha.
describe('AdminComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [provideRouter([]), ProductService, AuthAdminService],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should open and save password modal with valid data', () => {
    const fixture = TestBed.createComponent(AdminComponent);
    const component = fixture.componentInstance;

    component.openPasswordModal();
    expect(component.showPasswordModal()).toBe(true);

    TestBed.inject(AuthAdminService).LoginAdmin('admin', 'admin');
    component.currentPassword.set('admin');
    component.newPassword.set('novaSenha123');
    component.confirmPassword.set('novaSenha123');

    component.savePassword();
    expect(component.showPasswordModal()).toBe(false);
    expect(TestBed.inject(AuthAdminService).LoginAdmin('admin', 'novaSenha123')).toBe(true);
    expect(TestBed.inject(AuthAdminService).LoginAdmin('admin', 'admin')).toBe(false);
  });

  it('adiciona, edita e exclui produtos de verdade e salva no armazenamento', () => {
    const component = TestBed.createComponent(AdminComponent).componentInstance;
    const catalog = TestBed.inject(ProductService);
    const count = catalog.getProducts()().length;
    component.productName.set('Produto QA');
    component.productPrice.set(50);
    component.addProduct();
    expect(catalog.getProducts()()).toHaveLength(count + 1);
    const added = catalog.getProducts()().find((product) => product.title === 'Produto QA')!;
    component.editProduct(added);
    component.productName.set('Produto editado');
    component.productPrice.set(75);
    component.saveProduct();
    expect(catalog.getBaseProductById(added.id)?.price).toBe(75);
    expect(localStorage.getItem('agroagrega-catalog-v1')).toContain('Produto editado');
    component.deleteProduct(added.id);
    expect(catalog.getProducts()()).toHaveLength(count);
    expect(localStorage.getItem('agroagrega-catalog-v1')).not.toContain(added.id);
  });

  it('mantém as preferências de notificações ao reabrir o painel', () => {
    const component = TestBed.createComponent(AdminComponent).componentInstance;
    component.setNotificationPreference('orders', false);
    const reopened = TestBed.createComponent(AdminComponent).componentInstance;
    reopened.ngOnInit();
    expect(reopened.notificationPreferences()).toEqual({ orders: false, promotions: true });
  });

  afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); sessionStorage.clear(); });
});
