import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';

import { ProductDetails } from './product-details';
import { Cart } from '../../core/services/cart/cart.service';
import { CepService } from '../../core/services/cep/cep';
import { ProductService } from '../../core/services/product/product.service';
import { CepModel } from '../../models/cep.model';

describe('ProductDetails', () => {
  const productId = '1dsoifjasdf-1234-5678-90ab-cdefghijklmn';
  const referenceId = 'agro-040';
  const address: CepModel = {
    cep: '01001-000', logradouro: 'Praça da Sé', complemento: '', bairro: 'Sé',
    localidade: 'São Paulo', uf: 'SP',
  };
  let component: ProductDetails;
  let fixture: ComponentFixture<ProductDetails>;
  let route: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let cart: { addCartItem: ReturnType<typeof vi.fn> };
  let cep: { getCep: ReturnType<typeof vi.fn> };

  function navigateTo(id: string): void {
    route.next(convertToParamMap({ id }));
    fixture.detectChanges();
  }

  function button(label: string): HTMLButtonElement {
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const match = buttons.find((item) => item.getAttribute('aria-label') === label || item.textContent?.trim() === label);
    expect(match, `Botão ${label}`).toBeTruthy();
    return match!;
  }

  beforeEach(async () => {
    localStorage.removeItem(`agroagrega-product-questions:${productId}`);
    localStorage.removeItem(`agroagrega-product-questions:${referenceId}`);
    route = new BehaviorSubject(convertToParamMap({ id: productId }));
    cart = { addCartItem: vi.fn() };
    cep = { getCep: vi.fn().mockReturnValue(of(address)) };
    await TestBed.configureTestingModule({
      imports: [ProductDetails],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: route } },
        { provide: Cart, useValue: cart },
        { provide: CepService, useValue: cep },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem(`agroagrega-product-questions:${productId}`);
    localStorage.removeItem(`agroagrega-product-questions:${referenceId}`);
    vi.restoreAllMocks();
  });

  it('carrega o produto da rota e apresenta seu conteúdo real', () => {
    expect(component.id).toBe(productId);
    expect(component.product?.title).toBe('Kit Estação Meteorológica Inteligente AgroSense Pro');
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain(component.product!.title);
    expect(component.displaySku).toBe(productId);
    expect(component.isReferenceProduct).toBe(false);
  });

  it('apresenta os valores e informações da referência somente no adubo correspondente', () => {
    navigateTo(referenceId);
    expect(component.displayBrand).toBe('Nutrifoliar');
    expect(component.displayCategory).toBe('Fertilizantes');
    expect(component.displaySubcategory).toBe('Foliares');
    expect(component.displaySku).toBe('789456123789');
    expect(component.displayReviewCount).toBe(328);
    expect(component.reviewAverage).toBe(4.6);
    expect(component.product?.price).toBe(112.43);
    expect(component.displayOriginalPrice).toBe(128.9);
    expect(component.displayInstallments).toBe(3);
    expect(component.displayInstallmentValue).toBeCloseTo(37.4767, 3);
    expect(component.displaySpecifications).toContainEqual({ label: 'Código do produto', value: 'NF-5000' });
    expect(component.displayBenefits).toContain('Absorção eficiente');
    expect(fixture.nativeElement.querySelector('.product-price').textContent).toContain('112,43');
    navigateTo(productId);
    expect(component.displayBrand).toBe(component.product!.brand);
    expect(component.displayInstallments).toBe(10);
    expect(component.displaySpecifications).toContainEqual({ label: 'Código do produto', value: productId });
  });

  it('mantém galeria e informações disponíveis para todos os produtos', () => {
    const products = TestBed.inject(ProductService).getProducts()();
    expect(products).toHaveLength(52);
    for (const product of products) {
      component.product = product;
      expect(component.galleryViews.length).toBeGreaterThanOrEqual(2);
      expect(new Set(component.galleryViews.map((view) => view.src)).size).toBe(component.galleryViews.length);
      expect(component.displaySpecifications).toHaveLength(8);
      expect(component.displayBenefits).toHaveLength(4);
      expect(component.displayDescription).toBeTruthy();
    }
  });

  it('deduplica as fotos e ignora índices inválidos', () => {
    component.product = { ...component.product!, images: ['first.jpg', 'second.jpg', 'first.jpg'] };
    expect(component.galleryViews.map((view) => view.src)).toEqual(['first.jpg', 'second.jpg']);
    component.selectImage(1);
    component.selectImage(-1);
    component.selectImage(10);
    expect(component.selectedImage).toBe('second.jpg');
  });

  it('navega pelas fotos em ambas as direções e retorna ao início', () => {
    component.product = { ...component.product!, images: ['first.jpg', 'second.jpg', 'third.jpg'] };
    component.nextImage();
    expect(component.selectedImage).toBe('second.jpg');
    component.selectImage(2);
    component.nextImage();
    expect(component.selectedImageIndex).toBe(0);
    component.previousImage();
    expect(component.selectedImage).toBe('third.jpg');
  });

  it('não tenta ampliar ou navegar quando faltam imagens', () => {
    component.product = { ...component.product!, images: [] };
    component.nextImage();
    component.previousImage();
    component.openZoom();
    expect(component.selectedImageIndex).toBe(0);
    expect(component.zoomOpen).toBe(false);
  });

  it('abre a galeria ampliada pelo botão e fecha com Escape', () => {
    button('Ampliar imagem').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe('Galeria ampliada');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(component.zoomOpen).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('abre as formas de pagamento e as fecha pelo controle visível', () => {
    button('Pagamento por Pix').click();
    fixture.detectChanges();
    expect(component.modal).toBe('payments');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')?.textContent).toContain('Formas de pagamento');
    button('Fechar').click();
    fixture.detectChanges();
    expect(component.modal).toBeNull();
  });

  it('permite pausar e reproduzir a apresentação do produto', () => {
    button('Reproduzir apresentação do produto').click();
    fixture.detectChanges();
    expect(component.modal).toBe('presentation');
    button('Pausar apresentação').click();
    fixture.detectChanges();
    expect(component.presentationPlaying).toBe(false);
    button('Reproduzir apresentação').click();
    expect(component.presentationPlaying).toBe(true);
  });

  it('mantém apenas a resposta da pergunta selecionada aberta', () => {
    navigateTo(referenceId);
    const firstQuestion = fixture.nativeElement.querySelector('.question-list button') as HTMLButtonElement;
    expect(firstQuestion.getAttribute('aria-expanded')).toBe('false');
    firstQuestion.click();
    fixture.detectChanges();
    expect(firstQuestion.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('.question-list p')?.textContent).toContain('Consulte o rótulo');
    component.toggleQuestion(1);
    expect(component.openQuestionIndex).toBe(1);
    component.toggleQuestion(1);
    expect(component.openQuestionIndex).toBeNull();
    component.toggleQuestion(-1);
    component.toggleQuestion(100);
    expect(component.openQuestionIndex).toBeNull();
  });

  it('salva a pergunta neste navegador e a recupera ao voltar ao produto', () => {
    const question = 'Como conservar a embalagem após aberta?';
    navigateTo(referenceId);
    component.questionText = `  ${question}  `;
    component.submitQuestion();
    expect(component.questions[0].question).toBe(question);
    expect(component.questionFeedback).toContain('neste navegador');
    expect(component.questionText).toBe('');
    expect(JSON.parse(localStorage.getItem(`agroagrega-product-questions:${referenceId}`)!)[0].question).toBe(question);
    navigateTo(productId);
    expect(component.questions.some((entry) => entry.question === question)).toBe(false);
    navigateTo(referenceId);
    expect(component.questions[0].question).toBe(question);
  });

  it('rejeita perguntas vazias ou acima do limite', () => {
    const before = component.questions.length;
    component.questionText = '  ';
    component.submitQuestion();
    component.questionText = 'a'.repeat(301);
    component.submitQuestion();
    expect(component.questions).toHaveLength(before);
  });

  it('mantém a pergunta na sessão caso o armazenamento esteja indisponível', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage unavailable'); });
    component.questionText = 'Como instalar?';
    component.submitQuestion();
    expect(component.questions[0].question).toBe('Como instalar?');
    expect(component.questionFeedback).toContain('nesta sessão');
  });

  it('rejeita CEP incompleto sem consultar a rede', () => {
    component.shippingCep = '123';
    component.calculateShipping();
    expect(cep.getCep).not.toHaveBeenCalled();
    expect(component.shippingError).toContain('8 dígitos');
    expect(component.shippingLoading).toBe(false);
    expect(component.shippingResult).toBeNull();
  });

  it('consulta um CEP válido com o serviço simulado e mostra a entrega', () => {
    component.shippingCep = '01001-000';
    component.calculateShipping();
    expect(cep.getCep).toHaveBeenCalledWith('01001000');
    expect(component.shippingResult?.destinationLabel).toContain('São Paulo');
    expect(component.shippingResult?.simulated).toBe(true);
    expect(component.shippingResult?.originPostalCode).toBe('20211060');
    expect(component.shippingResult?.options).toHaveLength(2);
    expect(component.shippingResult!.options[0].price).toBeGreaterThan(0);
    expect(component.shippingLoading).toBe(false);
    expect(component.shippingError).toBe('');
  });

  it('informa CEP inexistente e falha de consulta sem deixar carregamento ativo', () => {
    cep.getCep.mockReturnValue(of({ erro: true }));
    component.shippingCep = '99999999';
    component.calculateShipping();
    expect(component.shippingError).toContain('não encontrado');
    expect(component.shippingResult).toBeNull();
    cep.getCep.mockReturnValue(throwError(() => new Error('offline')));
    component.calculateShipping();
    expect(component.shippingError).toContain('Não foi possível');
    expect(component.shippingLoading).toBe(false);
  });

  it('ignora uma consulta de CEP que terminou após trocar de produto', () => {
    const response = new Subject<CepModel>();
    cep.getCep.mockReturnValue(response);
    component.shippingCep = '01001000';
    component.calculateShipping();
    navigateTo(referenceId);
    response.next(address);
    response.complete();
    expect(component.shippingResult).toBeNull();
    expect(component.shippingLoading).toBe(false);
  });

  it('mostra o resultado assíncrono e libera o botão sem outro clique na tela', async () => {
    const response = new Subject<CepModel>();
    cep.getCep.mockReturnValue(response);
    component.openModal('shipping');
    component.shippingCep = '01001000';
    component.calculateShipping();
    await fixture.whenStable();
    expect(button('Consultando...').disabled).toBe(true);

    response.next(address);
    response.complete();
    await fixture.whenStable();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('Entrega econômica');
    expect(dialog.textContent).toContain('Entrega expressa');
    expect(dialog.textContent).toContain('São Paulo');
    expect(dialog.querySelectorAll('.shipping-result')).toHaveLength(2);
    expect(button('Calcular entrega').disabled).toBe(false);
  });

  it('mostra erro assíncrono e permite tentar novamente', async () => {
    const response = new Subject<CepModel>();
    cep.getCep.mockReturnValue(response);
    component.openModal('shipping');
    component.shippingCep = '01001000';
    component.calculateShipping();
    await fixture.whenStable();
    response.error(new Error('Não foi possível consultar o CEP.'));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('Não foi possível');
    expect(button('Calcular entrega').disabled).toBe(false);
  });

  it('cancela a consulta e limpa valores ao editar o CEP', async () => {
    const response = new Subject<CepModel>();
    cep.getCep.mockReturnValue(response);
    component.openModal('shipping');
    component.shippingCep = '01001000';
    component.calculateShipping();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input[name="cep"]') as HTMLInputElement;
    input.value = '20211060';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    response.next(address);
    expect(component.shippingResult).toBeNull();
    expect(component.shippingLoading).toBe(false);
    expect(response.observed).toBe(false);
  });

  it('recalcula pela quantidade atual sem manter uma cotação antiga', () => {
    component.shippingCep = '01001000';
    component.calculateShipping();
    const firstPrice = component.shippingResult!.options[0].price;
    component.increaseQuantity();
    expect(component.shippingResult).toBeNull();
    component.calculateShipping();
    expect(component.shippingResult!.quantity).toBe(2);
    expect(component.shippingResult!.options[0].price).toBeGreaterThan(firstPrice);
    component.decreaseQuantity();
    expect(component.shippingResult).toBeNull();
  });

  it('altera a quantidade pelos botões e envia a escolha ao carrinho', () => {
    button('Aumentar quantidade').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.quantity-control span').textContent).toBe('2');
    button('Adicionar ao carrinho').click();
    fixture.detectChanges();
    expect(cart.addCartItem).toHaveBeenCalledExactlyOnceWith(component.product, 2);
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain('Produto adicionado');
  });

  it('envia ao carrinho o mesmo preço exibido na referência', () => {
    navigateTo(referenceId);
    component.addToCart();
    expect(cart.addCartItem).toHaveBeenCalledWith(expect.objectContaining({ id: referenceId, price: 112.43 }), 1);
  });

  it('permite seguir e deixar de seguir a loja pelo novo cartão', () => {
    const follow = fixture.nativeElement.querySelector('.follow-store-button') as HTMLButtonElement;
    expect(follow.textContent).toContain('Seguir loja');
    expect(follow.getAttribute('aria-pressed')).toBe('false');
    follow.click();
    fixture.detectChanges();
    expect(follow.textContent).toContain('Seguindo');
    expect(follow.getAttribute('aria-pressed')).toBe('true');
    follow.click();
    fixture.detectChanges();
    expect(follow.textContent).toContain('Seguir loja');
    expect(component.followingStore).toBe(false);
  });

  it('abre o catálogo da loja e atualiza sua identidade ao trocar de produto', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.partner-avatar')?.getAttribute('src')).toBe('/assets/images/partner-stores/agrosense.png');
    expect(host.querySelector('.visit-store-link')?.getAttribute('href')).toBe('/products?search=AgroSense');
    expect(host.querySelector('.partner-club')?.getAttribute('href')).toBe('/agro-plus');
    const nextProduct = TestBed.inject(ProductService).getProducts()()
      .find((item) => item.brand === 'Biomatrix')!;
    navigateTo(nextProduct.id);
    expect(host.querySelector('.partner-store-name h3')?.textContent).toContain('Biomatrix');
    expect(host.querySelector('.partner-avatar')?.getAttribute('src')).toBe('/assets/images/partner-stores/biomatrix.png');
    expect(host.querySelector('.visit-store-link')?.getAttribute('href')).toBe('/products?search=Biomatrix');
  });

  it('mostra quatro relacionados da categoria atual com links para seus detalhes', () => {
    const host = fixture.nativeElement as HTMLElement;
    const cards = Array.from(host.querySelectorAll<HTMLAnchorElement>('.related-product'));
    expect(cards).toHaveLength(4);
    for (const [index, card] of cards.entries()) {
      const related = component.sidebarRelatedProducts[index];
      expect(related.id).not.toBe(component.product!.id);
      expect(related.category).toBe(component.product!.category);
      expect(card.getAttribute('href')).toBe(`/products/${related.id}`);
      expect(card.querySelector('h3')?.textContent).toContain(related.title);
      expect(card.querySelector('.related-product-price')?.textContent).toBe(component.formatMoney(related.price));
    }
    expect(host.querySelector('.view-related-link')?.getAttribute('href')).toContain('category=');
    navigateTo(referenceId);
    expect(host.querySelector('.related-product-category')?.textContent).toContain('Insumos');
  });

  it('mantém a quantidade mínima e rejeita compra inválida', () => {
    component.decreaseQuantity();
    expect(component.quantity).toBe(1);
    component.quantity = 0;
    component.addToCart();
    component.quantity = 1;
    component.product = undefined;
    component.addToCart();
    expect(cart.addCartItem).not.toHaveBeenCalled();
  });

  it('abre avaliações e aceita uma avaliação preenchida', () => {
    const service = TestBed.inject(ProductService);
    const saveReview = vi.spyOn(service, 'addReview').mockImplementation(() => {});
    button('Ler avaliações').click();
    fixture.detectChanges();
    expect(component.modal).toBe('reviews');
    const previousCount = component.displayReviewCount;
    component.selectRating(5);
    component.reviewText = 'Atendeu à necessidade da propriedade.';
    component.submitReview();
    expect(saveReview).toHaveBeenCalledWith(productId, expect.objectContaining({ stars: 5, text: 'Atendeu à necessidade da propriedade.' }));
    expect(component.displayReviewCount).toBe(previousCount + 1);
    expect(component.reviewText).toBe('');
    expect(component.selectedRating).toBe(0);
  });

  it('limpa os controles abertos ao navegar para outro produto', () => {
    component.quantity = 3;
    component.selectImage(1);
    component.openModal('payments');
    component.toggleQuestion(0);
    navigateTo(referenceId);
    expect(component.quantity).toBe(1);
    expect(component.selectedImageIndex).toBe(0);
    expect(component.modal).toBeNull();
    expect(component.openQuestionIndex).toBeNull();
  });

  it('exibe retorno ao catálogo quando o produto não existe', () => {
    navigateTo('produto-inexistente');
    expect(component.productNotFound).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Produto não encontrado');
    expect(fixture.nativeElement.querySelector('.not-found a').getAttribute('href')).toBe('/products');
  });
});
