import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AddressService } from '@core/services/address/address.service';
import { Auth } from '@core/services/auth/auth.service';
import { AvatarId, AvatarService } from '@core/services/avatar/avatar.service';
import { CepService } from '@core/services/cep/cep';
import { AddressModel } from '@models/address.model';
import { errorMessages } from '@shared/constants/form-error-messages';

@Component({
  selector: 'app-minha-conta',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './minha-conta.html',
  styleUrls: ['./minha-conta.css', './account-header.css'],
})
export class MinhaConta {
  private readonly auth = inject(Auth);
  private readonly cepService = inject(CepService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly addressService = inject(AddressService);
  readonly avatar = inject(AvatarService);

  userName = this.auth.getName();
  userEmail = this.auth.getEmail();
  userAddresses: AddressModel[] = [];
  editingProfile = false;
  readonly photoLoading = signal(false);
  readonly photoMessage = signal('');
  readonly photoError = signal('');
  notificationsOpen = false;
  isAddressFormOpen = false;
  editingAddressIndex: number | null = null;

  get firstName(): string {
    return this.userName.trim().split(/\s+/)[0] || 'produtor';
  }

  readonly profileForm = this.formBuilder.nonNullable.group({
    name: [this.userName, [Validators.required, Validators.minLength(3)]],
    email: [this.userEmail, [Validators.required, Validators.email]],
  });

  readonly addressForm = this.formBuilder.nonNullable.group({
    fullName: [this.userName, [Validators.required, Validators.minLength(3)]],
    cep: ['', [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
    address: ['', [Validators.required]],
    number: ['', [Validators.required]],
    neighborhood: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    complement: [''],
    referencePoint: [''],
  });

  constructor() {
    this.loadAddresses();
  }

  private loadAddresses(): void {
    const userId = this.auth.getId();
    if (!userId) {
      this.userAddresses = [];
      return;
    }

    this.userAddresses = this.addressService.getAddresses(userId);
  }

  getErrorMessage(control: AbstractControl): string {
    if (!control.errors) {
      return '';
    }

    const errorKey = Object.keys(control.errors)[0];

    return errorMessages[errorKey as keyof typeof errorMessages] ?? '';
  }

  editProfile(): void {
    this.editingProfile = true;
  }

  selectAvatar(avatarId: AvatarId): void {
    this.photoError.set('');
    try {
      this.avatar.selectAvatar(avatarId);
      this.photoMessage.set('Avatar atualizado!');
    } catch {
      this.photoError.set('Não foi possível salvar o avatar neste dispositivo. Tente novamente.');
    }
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.photoLoading()) return;
    this.photoError.set('');
    this.photoMessage.set('');
    this.photoLoading.set(true);
    try {
      await this.avatar.selectPhoto(file);
      this.photoMessage.set('Foto de perfil atualizada! Ela fica salva neste dispositivo.');
    } catch (error) {
      this.photoError.set(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar a foto. Tente novamente.',
      );
    } finally {
      this.photoLoading.set(false);
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;

    const name = this.profileForm.controls.name.value.trim();
    const email = this.profileForm.controls.email.value.trim().toLowerCase();
    if (!name) return;

    const result = this.auth.updateProfile(name, email);
    if (!result.res) return;

    this.userName = name;
    this.userEmail = email;
    this.editingProfile = false;
  }

  startAddAddress(): void {
    this.isAddressFormOpen = true;
    this.editingAddressIndex = null;
    this.addressForm.reset({
      fullName: '',
      cep: '',
      address: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      complement: '',
      referencePoint: '',
    });
  }

  editAddress(address: AddressModel, index: number): void {
    this.isAddressFormOpen = true;
    this.editingAddressIndex = index;
    this.addressForm.patchValue(address);
  }

  cancelAddressEdit(): void {
    this.isAddressFormOpen = false;
    this.editingAddressIndex = null;
    this.addressForm.reset({
      fullName: this.userName,
      cep: '',
      address: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      complement: '',
      referencePoint: '',
    });
  }

  buscarEnderecoPorCep(): void {
    const cep = this.addressForm.controls.cep.value.replace(/\D/g, '');

    if (cep.length !== 8) {
      this.addressForm.controls.cep.setErrors({ invalidCep: true });
      return;
    }

    this.cepService.getCep(cep).subscribe({
      next: (dados) => {
        if (dados.erro) {
          this.addressForm.controls.cep.setErrors({ invalidCep: true });
          return;
        }

        this.addressForm.patchValue({
          address: dados.logradouro || '',
          neighborhood: dados.bairro || '',
          city: dados.localidade || '',
          state: dados.uf || '',
          complement: dados.complemento || '',
        });
      },
      error: () => {
        this.addressForm.controls.cep.setErrors({ invalidCep: true });
      },
    });
  }

  saveAddress(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }
    const id =
      this.editingAddressIndex === null
        ? crypto.randomUUID()
        : this.userAddresses[this.editingAddressIndex].id;

    const address: AddressModel = {
      id,
      fullName: this.addressForm.controls.fullName.value.trim(),
      cep: this.addressForm.controls.cep.value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d{3})/, '$1-$2'),
      address: this.addressForm.controls.address.value.trim(),
      number: this.addressForm.controls.number.value.trim(),
      neighborhood: this.addressForm.controls.neighborhood.value.trim(),
      city: this.addressForm.controls.city.value.trim(),
      state: this.addressForm.controls.state.value.trim().toUpperCase(),
      complement: this.addressForm.controls.complement.value.trim(),
      referencePoint: this.addressForm.controls.referencePoint.value.trim(),
    };

    if (this.editingAddressIndex === null) {
      this.userAddresses = [...this.userAddresses, address];
    } else {
      const nextAddresses = [...this.userAddresses];
      nextAddresses[this.editingAddressIndex] = address;
      this.userAddresses = nextAddresses;
    }

    const userId = this.auth.getId();

    if (!userId) {
      return;
    }

    this.addressService.saveAddresses(userId, this.userAddresses);
    this.cancelAddressEdit();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  removeAccount(): void {
    const confirmed = confirm(
      'Tem certeza que deseja remover sua conta? Esta ação não poderá ser desfeita.',
    );

    if (!confirmed) {
      return;
    }

    const removed = this.auth.removeAccount();
    if (!removed) {
      return;
    }

    this.router.navigateByUrl('/');
  }

  cancelEdit(): void {
    this.editingProfile = false;
    this.profileForm.reset({
      name: this.userName,
      email: this.userEmail,
    });
  }
}
