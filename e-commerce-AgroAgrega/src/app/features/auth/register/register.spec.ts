import {
  fireEvent,
  render,
  screen,
} from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { Register } from './register';
import { Auth } from '@core/services/auth/auth.service';

describe('Register', () => {
  // Em um teste unitário, substituímos o serviço real por um mock.
  // Assim, não gravamos usuários nem dependemos do armazenamento da aplicação.
  const authMock: Pick<Auth, 'register'> = {
    register: vi.fn(),
  };

  beforeEach(() => {
    // Isola os testes: chamadas e respostas de um cenário não afetam o próximo.
    vi.resetAllMocks();
  });

  async function renderRegister() {
    // Centraliza a configuração comum usada por todos os cenários.
    // O router é fornecido porque o template possui links com routerLink.
    return render(Register, {
      providers: [
        provideRouter([]),
        { provide: Auth, useValue: authMock },
      ],
    });
  }

  it('exibe os erros ao enviar o formulário vazio', async () => {
    // Arrange: prepara a tela de cadastro sem preencher nenhum campo.
    await renderRegister();

    const submitButton = screen.getByRole(
      'button',
      { name: /criar minha conta/i },
    );
    const form = submitButton.closest('form');

    // Act: representa o usuário clicando para criar a conta.
    // O formulário é enviado mesmo estando vazio para disparar as validações.
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    // Assert: cada mensagem esperada confirma que a validação correspondente
    // foi executada e que o usuário recebeu uma orientação clara.
    expect(
      screen.getByText('Informe seu nome completo.'),
    ).toBeTruthy();
    expect(
      screen.getByText('Informe seu e-mail.'),
    ).toBeTruthy();
    expect(
      screen.getByText('A senha deve ter pelo menos 6 caracteres.'),
    ).toBeTruthy();
    expect(
      screen.getByText('Confirme sua senha.'),
    ).toBeTruthy();
    expect(
      screen.getByText('Você precisa aceitar os Termos de Uso.'),
    ).toBeTruthy();

    // Um formulário inválido não pode chamar o serviço de autenticação.
    expect(authMock.register).not.toHaveBeenCalled();
  });

  it('alterna a visibilidade das senhas', async () => {
    // Arrange: renderiza o cadastro e localiza os dois campos de senha.
    await renderRegister();

    const password = screen.getByLabelText('Senha');
    const confirmation = screen.getByLabelText('Confirme sua senha');

    // Assert inicial: as senhas devem ficar ocultas por segurança.
    expect(password.getAttribute('type')).toBe('password');
    expect(confirmation.getAttribute('type')).toBe('password');

    const showButtons = screen.getAllByRole(
      'button',
      { name: 'Mostrar' },
    );

    // Act: o usuário clica no botão de visualização de cada senha.
    fireEvent.click(showButtons[0]);
    fireEvent.click(showButtons[1]);

    // Assert: os dois campos passam a exibir o texto digitado.
    expect(password.getAttribute('type')).toBe('text');
    expect(confirmation.getAttribute('type')).toBe('text');
  });

  it('registra uma conta com os valores sanitizados', async () => {
    // Arrange: define que o serviço responderá com sucesso ao cadastro.
    vi.mocked(authMock.register).mockReturnValue({
      res: true,
      message: '',
    });

    await renderRegister();

    // Act: simula o preenchimento feito pelo usuário.
    // Os espaços e as letras maiúsculas verificam a sanitização do componente.
    fireEvent.input(screen.getByLabelText('Nome completo'), {
      target: { value: '  Ana   Silva  ' },
    });
    fireEvent.input(screen.getByLabelText('E-mail'), {
      target: { value: ' ANA@EXEMPLO.COM ' },
    });
    fireEvent.input(screen.getByLabelText('Senha'), {
      target: { value: ' senha 123 ' },
    });
    fireEvent.input(screen.getByLabelText('Confirme sua senha'), {
      target: { value: ' senha 123 ' },
    });
    fireEvent.click(screen.getByRole('checkbox'));

    // Act: aceita os termos e envia o formulário preenchido.
    fireEvent.click(
      screen.getByRole('button', { name: /criar minha conta/i }),
    );

    // Assert: o serviço recebe nome, e-mail e senha já normalizados.
    // Isso confirma que a regra de sanitização ocorreu antes do cadastro.
    expect(authMock.register).toHaveBeenCalledWith(
      'Ana Silva',
      'ana@exemplo.com',
      'senha123',
    );
  });
});
