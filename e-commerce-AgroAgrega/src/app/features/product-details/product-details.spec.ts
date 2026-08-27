import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

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

const productId = '1dsoifjasdf-1234-5678-90ab-cdefghijklmn';

describe('ProductDetails', () => {
    // const productId = '1dsoifjasdf-1234-5678-90ab-cdefghijklmn';
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
  it('should select a valid product image', () => {
    component.product = {
      ...component.product!,
      images: ['image-1.jpg', 'image-2.jpg', 'image-3.jpg'],
    };

    component.selectImage(1);

    expect(component.selectedImageIndex).toBe(1);
    expect(component.selectedImage).toBe('image-2.jpg');
  });
  it('should ignore an invalid image index', () => {
    component.product = {
      ...component.product!,
      images: ['image-1.jpg', 'image-2.jpg'],
    };

    component.selectImage(10);

    expect(component.selectedImageIndex).toBe(0);
    expect(component.selectedImage).toBe('image-1.jpg');
  });
  it('should ignore a negative image index', () => {
    component.product = {
      ...component.product!,
      images: ['image-1.jpg', 'image-2.jpg'],
    };

    component.selectImage(-1);

    expect(component.selectedImageIndex).toBe(0);
    expect(component.selectedImage).toBe('image-1.jpg');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should read the product id from the route', () => {
    expect(component.id).toBe(productId);
  });

  it('should find the product by id', () => {
    expect(component.product).toBeTruthy();
    expect(component.product?.id).toBe(productId);
    expect(component.product?.title).toBe('Kit Estação Meteorológica Inteligente AgroSense Pro');
  });
  it('should move to the next image', () => {
    component.product = {
      ...component.product!,
      images: ['image-1.jpg', 'image-2.jpg', 'image-3.jpg'],
    };

    component.nextImage();

    expect(component.selectedImageIndex).toBe(1);
    expect(component.selectedImage).toBe('image-2.jpg');
  });
  it('should return to the first image after the last image', () => {
    component.product = {
      ...component.product!,
      images: ['image-1.jpg', 'image-2.jpg', 'image-3.jpg'],
    };

    component.selectImage(2);
    component.nextImage();

    expect(component.selectedImageIndex).toBe(0);
    expect(component.selectedImage).toBe('image-1.jpg');
  });
  it('should move to the previous image', () => {
    component.product = {
      ...component.product!,
      images: ['image-1.jpg', 'image-2.jpg', 'image-3.jpg'],
    };

    component.selectImage(2);
    component.previousImage();

    expect(component.selectedImageIndex).toBe(1);
    expect(component.selectedImage).toBe('image-2.jpg');
  });
  it('should return to the last image when moving previous from the first image', () => {
    component.product = {
      ...component.product!,
      images: ['image-1.jpg', 'image-2.jpg', 'image-3.jpg'],
    };

    component.previousImage();

    expect(component.selectedImageIndex).toBe(2);
    expect(component.selectedImage).toBe('image-3.jpg');
  });
  it('should not change image when product has no images', () => {
    component.product = {
      ...component.product!,
      images: [],
    };

    component.nextImage();

    expect(component.selectedImageIndex).toBe(0);

    component.previousImage();

    expect(component.selectedImageIndex).toBe(0);
  });

  it('should increase and decrease quantity within valid range', () => {
    expect(component.quantity).toBe(1);

    component.increaseQuantity();

    expect(component.quantity).toBe(2);

    component.decreaseQuantity();

    expect(component.quantity).toBe(1);

    component.decreaseQuantity();

    expect(component.quantity).toBe(1);
  });

  it('should identify when product exists', () => {
    expect(component.productNotFound).toBeFalsy();
  });

  it('should render product details', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain(`ID do produto: ${productId}`);
    expect(compiled.textContent).toContain('Kit Estação Meteorológica Inteligente AgroSense Pro');
    expect(compiled.textContent).toContain('Adicionar ao carrinho');
  });

  it('should call addCartItem with current product and quantity', () => {
    component.addToCart();

    expect(mockCartService.addCartItem).toHaveBeenCalledWith(component.product, component.quantity);

    expect(mockCartService.addCartItem).toHaveBeenCalledTimes(1);
  });

  it('should call addCartItem once with the selected quantity', () => {
    component.quantity = 3;

    component.addToCart();

    expect(mockCartService.addCartItem).toHaveBeenCalledWith(component.product, 3);

    expect(mockCartService.addCartItem).toHaveBeenCalledTimes(1);
  });

  it('should not call addCartItem when product does not exist', () => {
    component.product = undefined;

    component.addToCart();

    expect(mockCartService.addCartItem).not.toHaveBeenCalled();
  });

  it('should not add product when quantity is invalid', () => {
    component.quantity = 0;

    component.addToCart();

    expect(mockCartService.addCartItem).not.toHaveBeenCalled();
  });

  it('should identify when product does not exist', async () => {
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

  it('should switch tabs', () => {
    expect(component.activeTab).toBe('details');
    component.selectTab('reviews');
    expect(component.activeTab).toBe('reviews');
    component.selectTab('details');
    expect(component.activeTab).toBe('details');
  });

  it('should set selected rating within range 1-5', () => {
    component.selectRating(4);
    expect(component.selectedRating).toBe(4);

    component.selectRating(6);
    expect(component.selectedRating).toBe(4);

    component.selectRating(0);
    expect(component.selectedRating).toBe(4);
  });

  it('should submit review and refresh product reviews', () => {
    const initialReviewsCount = component.reviews.length;

    component.selectRating(5);
    component.reviewText = 'Excelente produto no campo!';
    component.submitReview();

    expect(component.reviews.length).toBe(initialReviewsCount + 1);
    expect(component.reviews[0].text).toBe('Excelente produto no campo!');
    expect(component.selectedRating).toBe(0);
    expect(component.reviewText).toBe('');
  });

  it('should not submit review if rating or text is missing', () => {
    const initialReviewsCount = component.reviews.length;

    component.selectedRating = 0;
    component.reviewText = 'Texto sem nota';
    component.submitReview();
    expect(component.reviews.length).toBe(initialReviewsCount);

    component.selectedRating = 5;
    component.reviewText = '   ';
    component.submitReview();
    expect(component.reviews.length).toBe(initialReviewsCount);
  });
});

