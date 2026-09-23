import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Register } from './register';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Auth } from '@core/services/auth/auth.service';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>
  const authMock = { register: vi.fn() };

  beforeEach(async () => {
    authMock.register.mockReset();
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideRouter([{ path: 'login', component: Register }]),
        { provide: Auth, useValue: authMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve exibir erros quando o formulário está inválido', () => {
    component.onSubmit({ preventDefault: vi.fn() } as unknown as SubmitEvent);

    expect(component.nameError()).toBe('Informe seu nome completo.');
    expect(component.emailError()).toBe('Informe seu e-mail.');
    expect(component.passwordError()).toBe('Informe sua senha.');
    expect(component.passwordConfirmationError()).toBe('Confirme sua senha.');
  });

  it('deve rejeitar senhas diferentes e cadastro recusado', () => {
    component.registerForm.setValue({
      name: 'Cliente AgroAgrega',
      email: 'cliente@example.com',
      password: '123456',
      passwordConfirmation: '654321',
      terms: true,
    });
    component.onSubmit({ preventDefault: vi.fn() } as unknown as SubmitEvent);
    expect(component.passwordConfirmationError()).toBe('As senhas precisam ser iguais.');

    component.registerForm.controls.passwordConfirmation.setValue('123456');
    authMock.register.mockReturnValue({ res: false, message: 'Email Já Cadastrado!' });
    component.onSubmit({ preventDefault: vi.fn() } as unknown as SubmitEvent);
    expect(component.registerError()).toBe('Email Já Cadastrado!');
  });

  it('deve sanitizar e registrar dados válidos', () => {
    component.registerForm.setValue({
      name: '  Cliente AgroAgrega  ',
      email: 'CLIENTE@EXAMPLE.COM',
      password: ' 123456 ',
      passwordConfirmation: ' 123456 ',
      terms: true,
    });
    authMock.register.mockReturnValue({ res: true, message: '' });

    component.onSubmit({ preventDefault: vi.fn() } as unknown as SubmitEvent);

    expect(authMock.register).toHaveBeenCalledWith(
      'Cliente AgroAgrega',
      'cliente@example.com',
      '123456',
    );
    expect(component.submitted()).toBe(true);
  });
});
//   const authMock = {
//     register: vi.fn(),
//   };

//   const routerMock = {
//     url: '/register',
//     navigateByUrl: vi.fn(),
//   };

//   beforeEach(() => {
//     vi.clearAllMocks();
//   });

//   async function setup() {
//     return render(Register, {
//       providers: [
//         {
//           provide: Auth,
//           useValue: authMock,
//         },
//         {
//           provide: Router,
//           useValue: routerMock,
//         },
//       ],
//     });
//   }

//   it('Deve renderez the registration form', async () => {
//     await setup();

//     expect(
//       screen.getByLabelText('Nome completo'),
//     ).toBeInTheDocument();

//     expect(
//       screen.getByLabelText('E-mail'),
//     ).toBeInTheDocument();

//     expect(
//       screen.getByLabelText('Senha'),
//     ).toBeInTheDocument();

//     expect(
//       screen.getByLabelText('Confirme sua senha'),
//     ).toBeInTheDocument();

//     expect(
//       screen.getByRole('checkbox'),
//     ).toBeInTheDocument();

//     expect(
//       screen.getByRole('button', {
//         name: /criar minha conta/i,
//       }),
//     ).toBeInTheDocument();
//   });

//   it('should register with valid data', async () => {
//     const user = userEvent.setup();

//     authMock.register.mockReturnValue({
//       res: true,
//       message: '',
//     });

//     await setup();

//     await user.type(
//       screen.getByLabelText('Nome completo'),
//       'João da Silva',
//     );

//     await user.type(
//       screen.getByLabelText('E-mail'),
//       'joao@email.com',
//     );

//     await user.type(
//       screen.getByLabelText('Senha'),
//       '123456',
//     );

//     await user.type(
//       screen.getByLabelText('Confirme sua senha'),
//       '123456',
//     );

//     await user.click(
//       screen.getByRole('checkbox'),
//     );

//     const submitButton = screen.getByRole(
//       'button',
//       {
//         name: /criar minha conta/i,
//       },
//     );

//     expect(submitButton).toBeEnabled();

//     await user.click(submitButton);

//     expect(authMock.register).toHaveBeenCalledOnce();

//     expect(authMock.register).toHaveBeenCalledWith(
//       'João da Silva',
//       'joao@email.com',
//       '123456',
//     );

//     expect(
//       routerMock.navigateByUrl,
//     ).toHaveBeenCalledWith('/login');
//   });
// });
