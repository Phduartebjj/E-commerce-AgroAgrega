import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ProductDetails } from './product-details';
import { Cart } from '../../core/services/cart/cart.service';

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

describe('ProductDetails com Angular Testing Library', () => {
  const productId = '1dsoifjasdf-1234-5678-90ab-cdefghijklmn';

  it('deve aumentar a quantidade e adicionar o produto ao carrinho pela tela', async () => {
    const mockCartService = {
      addCartItem: vi.fn(),
    };

    await render(ProductDetails, {
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
    });

    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Aumentar quantidade' }));
    await user.click(screen.getByRole('button', { name: 'Adicionar ao carrinho' }));

    expect(screen.getByText('2', { selector: '.quantity-control span' })).toBeTruthy();
    expect(mockCartService.addCartItem).toHaveBeenCalledWith(
      expect.objectContaining({ id: productId }),
      2,
    );
    expect(screen.getByRole('status').textContent).toContain('Produto adicionado');
  });
});
