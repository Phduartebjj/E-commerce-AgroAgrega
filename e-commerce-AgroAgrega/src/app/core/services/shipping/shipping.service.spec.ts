import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { appConfig } from '../../../app.config';
import { productsItems } from '../../data/products';
import { ShippingQuote } from '../../../models/shipping';
import { ShippingService } from './shipping.service';

describe('ShippingService', () => {
  let service: ShippingService;
  let http: HttpTestingController;
  const product = productsItems[0];
  const address = { cep: '21060-903', localidade: 'Rio de Janeiro', uf: 'RJ' };
  const viaCep = 'https://viacep.com.br/ws/21060903/json/';
  const brasilApi = 'https://brasilapi.com.br/api/cep/v1/21060903';

  beforeEach(() => {
    TestBed.configureTestingModule({
      // Use the application providers to also guard against the missing HttpClient regression.
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });
    service = TestBed.inject(ShippingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  it('consulta o endereço e retorna duas opções demonstrativas com preço e prazo', () => {
    let result: ShippingQuote | undefined;
    service.quote(product, 2, '21060-903').subscribe((quote) => result = quote);
    http.expectOne(viaCep).flush(address);
    expect(result?.destinationLabel).toBe('Rio de Janeiro – RJ');
    expect(result?.quantity).toBe(2);
    expect(result?.simulated).toBe(true);
    expect(result?.options).toHaveLength(2);
    expect(result!.options[0].price).toBeGreaterThan(0);
    expect(result!.options[1].price).toBeGreaterThan(result!.options[0].price);
    expect(result!.options[1].deliveryDays.max).toBeLessThan(result!.options[0].deliveryDays.max);
  });

  it.each(['123', '00000000', ''])('rejeita CEP inválido %s antes de chamar a rede', (cep) => {
    let message = '';
    service.quote(product, 1, cep).subscribe({ error: (error: Error) => message = error.message });
    expect(message).toContain('8 dígitos');
    http.expectNone(() => true);
  });

  it.each([0, -1, 1.5, 101])('rejeita a quantidade inválida %s', (quantity) => {
    let message = '';
    service.quote(product, quantity, '21060903').subscribe({ error: (error: Error) => message = error.message });
    expect(message).toContain('1 a 100');
    http.expectNone(() => true);
  });

  it('não calcula preço para CEP inexistente', () => {
    let message = '';
    service.quote(product, 1, '21060903').subscribe({ error: (error: Error) => message = error.message });
    http.expectOne(viaCep).flush({ erro: true });
    expect(message).toContain('CEP não encontrado');
    http.expectNone(brasilApi);
  });

  it('usa a BrasilAPI se a primeira consulta falhar', () => {
    let result: ShippingQuote | undefined;
    service.quote(product, 1, '21060903').subscribe((quote) => result = quote);
    http.expectOne(viaCep).error(new ProgressEvent('error'));
    http.expectOne(brasilApi).flush({ cep: '21060903', city: 'Rio de Janeiro', state: 'RJ' });
    expect(result?.destinationLabel).toBe('Rio de Janeiro – RJ');
    expect(result?.options).toHaveLength(2);
  });

  it('encerra a consulta quando os dois serviços não respondem', () => {
    vi.useFakeTimers();
    let message = '';
    service.quote(product, 1, '21060903').subscribe({ error: (error: Error) => message = error.message });
    const first = http.expectOne(viaCep);
    vi.advanceTimersByTime(4001);
    expect(first.cancelled).toBe(true);
    const second = http.expectOne(brasilApi);
    vi.advanceTimersByTime(4001);
    expect(second.cancelled).toBe(true);
    expect(message).toContain('demorou para responder');
  });

  it('informa falha de conexão sem inventar frete grátis', () => {
    let result: ShippingQuote | undefined;
    let message = '';
    service.quote(product, 1, '21060903').subscribe({
      next: (quote) => result = quote,
      error: (error: Error) => message = error.message,
    });
    http.expectOne(viaCep).error(new ProgressEvent('error'));
    http.expectOne(brasilApi).error(new ProgressEvent('error'));
    expect(result).toBeUndefined();
    expect(message).toContain('Verifique a conexão');
  });
});
