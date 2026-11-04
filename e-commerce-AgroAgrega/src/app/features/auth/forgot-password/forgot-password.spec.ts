// Este arquivo testa o componente responsável pela recuperação de senha.
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ForgotPassword } from './forgot-password';

describe('ForgotPassword', () => {
  // Representa a instância do componente que será validada pelo teste.
  let component: ForgotPassword;

  // Permite acessar o componente e o ambiente criado pelo Angular durante o teste.
  let fixture: ComponentFixture<ForgotPassword>;

  // Esta preparação é executada antes de cada caso de teste. Ela cria um
  // ambiente parecido com o da aplicação real, mas isolado e controlado.
  beforeEach(async () => {
    // Registra o componente que será testado e disponibiliza um roteador
    // vazio para que qualquer dependência de navegação seja resolvida.
    await TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [provideRouter([])],
    }).compileComponents();

    // Compila o componente e cria sua estrutura de teste. Se a configuração
    // estiver incorreta, o Angular apresentará um erro nesta etapa.
    fixture = TestBed.createComponent(ForgotPassword);

    // Obtém a instância da classe para que suas propriedades e seu estado
    // possam ser acessados durante os testes.
    component = fixture.componentInstance;

    // Aguarda o término das operações assíncronas de inicialização antes
    // de verificar o resultado, evitando uma validação prematura.
    await fixture.whenStable();
  });

  // Verifica o requisito mais básico: o componente deve existir após ser
  // configurado e criado pelo Angular. O teste falha se a criação gerar erro
  // ou se a instância não for encontrada.
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
