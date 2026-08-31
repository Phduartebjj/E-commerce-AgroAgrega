import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminComponent } from './admin';
import { ProductService } from '@core/services/product/product.service';
import { AuthAdminService } from '@core/services/auth/auth-admin.service';

describe('AdminComponent', () => {
  beforeEach(async () => {
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

    component.currentPassword.set('admin123');
    component.newPassword.set('novaSenha123');
    component.confirmPassword.set('novaSenha123');

    component.savePassword();
    expect(component.showPasswordModal()).toBe(false);
  });
});
