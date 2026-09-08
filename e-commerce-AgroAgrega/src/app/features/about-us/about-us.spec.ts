// Importa ferramentas de teste do Angular.
// ComponentFixture permite acessar o componente criado durante o teste.
// TestBed cria um ambiente de teste para o componente.
import { ComponentFixture, TestBed } from '@angular/core/testing';

// Importa o componente da página "About Us" que será testado.
import { AboutUsComponent } from './about-us';


// Agrupa todos os testes relacionados ao AboutUsComponent.
describe('AboutUsComponent', () => {

  // Guarda a instância do componente que será criada durante o teste.
  let component: AboutUsComponent;

  // Guarda o ambiente de teste do componente.
  let fixture: ComponentFixture<AboutUsComponent>;


  // O beforeEach é executado antes de cada teste.
  // Ele prepara o componente para que os testes possam ser realizados.
  beforeEach(async () => {

    // Configura o ambiente de testes do Angular.
    await TestBed.configureTestingModule({

      // Importa o AboutUsComponent para dentro do ambiente de teste.
      imports: [AboutUsComponent],

    }).compileComponents();


    // Cria uma instância do componente AboutUsComponent.
    fixture = TestBed.createComponent(AboutUsComponent);

    // Pega a instância criada e guarda na variável "component".
    component = fixture.componentInstance;

    // Aguarda o Angular terminar tarefas pendentes antes de continuar.
    await fixture.whenStable();
  });


  // ==============================
  // TESTE 1
  // ==============================

  // Verifica se o componente About Us foi criado corretamente.
  it('should create', () => {

    // Espera que "component" exista.
    // Se o componente foi criado, o teste PASSA.
    // Se não foi criado, o teste FALHA.
    expect(component).toBeTruthy();

  });


  // ==============================
  // TESTE 2
  // ==============================

  // Verifica se o título "Nossa Equipe" aparece para o usuário.
  it('deve mostrar o título Nossa Equipe', async () => {

    // Renderiza o template usando o fixture do Angular.
    fixture.detectChanges();

    const titulo = fixture.nativeElement.querySelector('h1');


    // Verifica se o título foi encontrado.
    // Se encontrou "Nossa Equipe", o teste PASSA.
    // Se não encontrou, o teste FALHA.
    expect(titulo).toBeTruthy();
    expect(titulo.textContent.trim()).toBe('Nossa Equipe');

  });

});