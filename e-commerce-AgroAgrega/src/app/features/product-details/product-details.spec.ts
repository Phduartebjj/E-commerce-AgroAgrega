import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ProductDetails } from './product-details';
import { Cart } from '../../core/services/cart/cart.service';
import { ProductService } from '../../core/services/product/product.service';

function createActivatedRoute(id: string) {
  return {
    paramMap: {
      subscribe: (callback: (params: { get: (key: string) => string | null }) => void) => {
        callback({
          get: (key: string) => (key === 'id' ? id : null),
        });
      },
    },
  };
}

// Verifica galeria, quantidade, perguntas, carrinho e conteúdo do produto.
describe('ProductDetails', () => {
  const productId = '1dsoifjasdf-1234-5678-90ab-cdefghijklmn';
  let component: ProductDetails;
  let fixture: ComponentFixture<ProductDetails>;

  let mockCartService: {
    addCartItem: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockCartService = {
      addCartItem: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProductDetails],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: createActivatedRoute(productId),
        },
        {
          provide: Cart,
          useValue: mockCartService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetails);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });
  it('deve selecionar uma imagem válida do produto', () => {
    component.product = {
      ...component.product!,
      images: ['image-1.jpg', 'image-2.jpg', 'image-3.jpg'],
    };

    component.selectImage(1);

    expect(component.selectedImageIndex).toBe(1);
    expect(component.selectedImage).toBe('image-2.jpg');
  });
  it('deve ignorar um índice de imagem inválido', () => {
    component.product = {
      ...component.product!,
      images: ['image-1.jpg', 'image-2.jpg'],
    };

    component.selectImage(10);

    expect(component.selectedImageIndex).toBe(0);
    expect(component.selectedImage).toBe('image-1.jpg');
  });
  it('deve ignorar um índice de imagem negativo', () => {
    component.product = {
      ...component.product!,
      images: ['image-1.jpg', 'image-2.jpg'],
    };

    component.selectImage(-1);

    expect(component.selectedImageIndex).toBe(0);
    expect(component.selectedImage).toBe('image-1.jpg');
  });

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  it('deve ler o ID do produto a partir da rota', () => {
    expect(component.id).toBe(productId);
  });

  it('deve encontrar o produto pelo ID', () => {
    expect(component.product).toBeTruthy();
    expect(component.product?.id).toBe(productId);
    expect(component.product?.title).toBe('Kit Estação Meteorológica Inteligente AgroSense Pro');
  });

  it('deve mostrar apenas arquivos de imagem distintos na galeria', () => {
    component.product = {
      ...component.product!,
      images: ['principal.webp', 'outro-angulo.webp', 'principal.webp'],
    };

    expect(component.galleryViews.map((view) => view.src)).toEqual([
      'principal.webp',
      'outro-angulo.webp',
    ]);
  });

  it('deve gerar galeria e informações completas para todos os produtos do catálogo', () => {
    const products = TestBed.inject(ProductService).getProducts()();

    expect(products).toHaveLength(52);

    for (const product of products) {
      component.product = product;

      expect(component.galleryViews.length).toBeGreaterThanOrEqual(2);
      expect(new Set(component.galleryViews.map((view) => view.src)).size).toBe(
        component.galleryViews.length,
      );
      expect(component.productSpecifications).toHaveLength(8);
      expect(component.productHighlights).toHaveLength(4);
      expect(component.productDescriptionParagraphs).toHaveLength(3);
      expect(component.relatedProducts.length).toBeGreaterThan(0);
    }
  });

  it('deve registrar uma pergunta do cliente na página do produto', () => {
    component.questionText = 'Este produto pode ser usado diariamente?';

    component.submitQuestion();

    expect(component.questions[0].question).toBe('Este produto pode ser usado diariamente?');
    expect(component.questionFeedback).toContain('sucesso');
    expect(component.questionText).toBe('');
  });
  it('deve mover para a próxima imagem', () => {
    component.product = {
      ...component.product!,
      images: ['image-1.jpg', 'image-2.jpg', 'image-3.jpg'],
    };

    component.nextImage();

    expect(component.selectedImageIndex).toBe(1);
    expect(component.selectedImage).toBe('image-2.jpg');
  });
  it('deve retornar para a primeira imagem após a última imagem', () => {
    component.product = {
      ...component.product!,
      images: ['image-1.jpg', 'image-2.jpg', 'image-3.jpg'],
    };

    component.selectImage(2);
    component.nextImage();

    expect(component.selectedImageIndex).toBe(0);
    expect(component.selectedImage).toBe('image-1.jpg');
  });
  it('deve mover para a imagem anterior', () => {
    component.product = {
      ...component.product!,
      images: ['image-1.jpg', 'image-2.jpg', 'image-3.jpg'],
    };

    component.selectImage(2);
    component.previousImage();

    expect(component.selectedImageIndex).toBe(1);
    expect(component.selectedImage).toBe('image-2.jpg');
  });
  it('deve retornar para a última imagem ao mover anterior a partir da primeira imagem', () => {
    component.product = {
      ...component.product!,
      images: ['image-1.jpg', 'image-2.jpg', 'image-3.jpg'],
    };

    component.previousImage();

    expect(component.selectedImageIndex).toBe(2);
    expect(component.selectedImage).toBe('image-3.jpg');
  });
  it('deve não alterar a imagem quando o produto não tem imagens', () => {
    component.product = {
      ...component.product!,
      images: [],
    };

    component.nextImage();

    expect(component.selectedImageIndex).toBe(0);

    component.previousImage();

    expect(component.selectedImageIndex).toBe(0);
  });

  it('deve aumentar e diminuir a quantidade dentro do intervalo válido', () => {
    expect(component.quantity).toBe(1);

    component.increaseQuantity();

    expect(component.quantity).toBe(2);

    component.decreaseQuantity();

    expect(component.quantity).toBe(1);

    component.decreaseQuantity();

    expect(component.quantity).toBe(1);
  });

  it('deve identificar quando o produto não existe', () => {
    expect(component.productNotFound).toBeFalsy();
  });

  it('deve renderizar os detalhes do produto', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain(`ID do produto: ${productId}`);
    expect(compiled.textContent).toContain('Kit Estação Meteorológica Inteligente AgroSense Pro');
    expect(compiled.textContent).toContain('Adicionar ao carrinho');
    const sellerLogos = compiled.querySelectorAll<HTMLImageElement>('.seller-logo img');
    expect(sellerLogos).toHaveLength(3);
    expect(sellerLogos[0]?.getAttribute('src')).toBe('/assets/images/partner-stores/agrosense.png');
    expect(sellerLogos[0]?.alt).toContain('AgroSense');
  });

  it('deve apresentar uma estrutura visual completa nas ações principais', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const actionSelectors = [
      '.commerce-action--cart',
      '.question-action',
      '.review-action',
      '.partner-store-cta',
    ];

    for (const selector of actionSelectors) {
      const action = compiled.querySelector<HTMLElement>(selector);

      expect(action).toBeTruthy();
      expect(action?.querySelector('.commerce-action__icon')).toBeTruthy();
      expect(action?.querySelector('.commerce-action__copy strong')).toBeTruthy();
      expect(action?.querySelector('.commerce-action__arrow')).toBeTruthy();
    }

    const followButton = compiled.querySelector<HTMLElement>('.store-follow-button');
    expect(followButton?.querySelector('.commerce-action__copy strong')?.textContent).toContain(
      'Seguir loja',
    );
    expect(followButton?.querySelector('.commerce-action__icon')).toBeNull();
    expect(followButton?.querySelector('.commerce-action__arrow')).toBeNull();
  });

  it('deve exibir garantias, perfil da loja e meios de pagamento abaixo do vendedor', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.seller-assurances')?.textContent).toContain('Devolução grátis');
    expect(compiled.querySelector('.seller-assurances')?.textContent).toContain('Compra Garantida');
    expect(compiled.querySelector('.seller-assurances')?.textContent).toContain(
      '12 meses de garantia',
    );
    expect(compiled.querySelector('.partner-store-profile')).toBeTruthy();
    expect(compiled.querySelector('.payment-methods-card')).toBeTruthy();
  });

  it('deve permitir seguir e deixar de seguir a loja parceira', () => {
    expect(component.followingStore).toBe(false);

    component.toggleStoreFollow();
    fixture.detectChanges();

    expect(component.followingStore).toBe(true);
    expect(fixture.nativeElement.querySelector('.store-follow-button')?.textContent).toContain(
      'Seguindo',
    );
  });

  it('deve manter o botão de seguir na linha superior do perfil da loja', () => {
    const header = fixture.nativeElement.querySelector('.partner-store-profile__header');

    expect(header?.querySelector('.store-follow-button')).toBeTruthy();
  });

  it('deve usar os mesmos cards do catálogo nos produtos relacionados', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('.related-grid app-product-card')).toHaveLength(
      component.relatedProducts.length,
    );
    expect(compiled.querySelector('.related-card')).toBeNull();
  });

  it('deve exibir produtos relacionados logo abaixo dos meios de pagamento', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const paymentMethods = compiled.querySelector('.payment-methods-card');
    const purchaseRelated = compiled.querySelector('.purchase-related-products');

    expect(purchaseRelated).toBeTruthy();
    expect(purchaseRelated?.textContent).toContain('Produtos relacionados');
    expect(purchaseRelated?.querySelectorAll('.purchase-related-card')).toHaveLength(
      component.sidebarRelatedProducts.length,
    );
    expect(paymentMethods?.nextElementSibling).toBe(purchaseRelated);
  });

  it('deve preencher a coluna abaixo da galeria com as informações do produto', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heroMain = compiled.querySelector('.product-hero__main');

    expect(heroMain?.querySelector('.gallery-panel')).toBeTruthy();
    expect(heroMain?.querySelector('.trust-strip')).toBeTruthy();
    expect(heroMain?.querySelector('.product-overview')).toBeTruthy();
    expect(heroMain?.querySelector('#specifications')).toBeTruthy();
    expect(heroMain?.querySelector('.description-section')).toBeTruthy();
    expect(heroMain?.querySelector('.questions-section')).toBeTruthy();
    expect(compiled.querySelector('.product-content .product-overview')).toBeNull();
  });

  it('deve chamar addCartItem com o produto e a quantidade atuais', () => {
    component.addToCart();

    expect(mockCartService.addCartItem).toHaveBeenCalledWith(component.product, component.quantity);

    expect(mockCartService.addCartItem).toHaveBeenCalledTimes(1);
  });

  it('deve chamar addCartItem uma vez com a quantidade selecionada', () => {
    component.quantity = 3;

    component.addToCart();

    expect(mockCartService.addCartItem).toHaveBeenCalledWith(component.product, 3);

    expect(mockCartService.addCartItem).toHaveBeenCalledTimes(1);
  });

  it('deve não chamar addCartItem quando o produto não existe', () => {
    component.product = undefined;

    component.addToCart();

    expect(mockCartService.addCartItem).not.toHaveBeenCalled();
  });

  it('deve não adicionar o produto quando a quantidade é inválida', () => {
    component.quantity = 0;

    component.addToCart();

    expect(mockCartService.addCartItem).not.toHaveBeenCalled();
  });

  it('deve identificar quando o produto não existe', async () => {
    await TestBed.resetTestingModule();

    const mockCartServiceNotFound = {
      addCartItem: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProductDetails],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: createActivatedRoute('999'),
        },
        {
          provide: Cart,
          useValue: mockCartServiceNotFound,
        },
      ],
    }).compileComponents();

    const notFoundFixture = TestBed.createComponent(ProductDetails);

    const notFoundComponent = notFoundFixture.componentInstance;

    notFoundFixture.detectChanges();

    expect(notFoundComponent.id).toBe('999');
    expect(notFoundComponent.product).toBeUndefined();
    expect(notFoundComponent.productNotFound).toBe(true);
  });
});

describe('ProductDetails com Vitest', () => {
  it('deve aumentar e diminuir a quantidade', () => {
    // Cria uma instância simples para testar a lógica da classe.
    const component = Object.create(ProductDetails.prototype) as ProductDetails; // Cria um novo objeto JavaScript puro, e define o protótipo desse novo objeto como o protótipo da classe ProductDetails
    component.quantity = 1;

    // Chama os métodos diretamente
    component.increaseQuantity();
    component.decreaseQuantity();
    component.decreaseQuantity();

    // O Vitest verifica o estado final da propriedade quantity.
    expect(component.quantity).toBe(1);
  });
});

describe('ProductDetails com Angular Testing Library', () => {
  const productId = '1dsoifjasdf-1234-5678-90ab-cdefghijklmn';

  it('deve aumentar a quantidade e adicionar o produto ao carrinho pela tela', async () => {
    // Mock do serviço: permite verificar a chamada sem usar o carrinho real.
    const mockCartService = {
      addCartItem: vi.fn(),
    };

    // Renderiza o componente com os providers necessários para a tela funcionar.
    await render(ProductDetails, {
      providers: [
        provideRouter([]),
        {
          // Simula o ID do produto recebido pela rota.
          provide: ActivatedRoute,
          useValue: createActivatedRoute(productId),
        },
        {
          // Substitui o serviço real pelo mock criado acima.
          provide: Cart,
          useValue: mockCartService,
        },
      ],
    });

    // Cria um usuário simulado para executar ações como no navegador.
    const user = userEvent.setup();

    // Acessa os botões pelo nome acessível e simula as ações do usuário.
    await user.click(screen.getByRole('button', { name: 'Aumentar quantidade' }));

    // Confirma que a quantidade exibida foi alterada de 1 para 2.
    expect(screen.getByText('2', { selector: '.quantity-control span' })).toBeTruthy();

    // Clica no botão "Adicionar ao carrinho".
    await user.click(screen.getByRole('button', { name: 'Adicionar ao carrinho' }));

    // Confirma que a mensagem de sucesso foi exibida na interface.
    expect(screen.getByRole('status').textContent).toContain('Produto adicionado');

    // Confirma que o produto e a quantidade correta foram enviados ao carrinho.
    expect(mockCartService.addCartItem).toHaveBeenCalledWith(
      expect.objectContaining({ id: productId }),
      2,
    );
  });
});
