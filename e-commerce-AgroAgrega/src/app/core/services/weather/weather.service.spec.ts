import {
  provideHttpClient,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { WeatherService } from './weather.service';

// Verifica a montagem da requisição de clima e a validação das coordenadas.
describe('WeatherService', () => {
  let service: WeatherService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WeatherService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(WeatherService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('deve enviar os parâmetros esperados para o Open-Meteo', () => {
    service.getCurrentWeather(-22.9068, -43.1729).subscribe();

    const request = httpTesting.expectOne(
      (request) => request.url === 'https://api.open-meteo.com/v1/forecast',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('latitude')).toBe('-22.9068');
    expect(request.request.params.get('longitude')).toBe('-43.1729');
    expect(request.request.params.get('timezone')).toBe('auto');
    expect(request.request.params.get('current')).toContain('temperature_2m');

    request.flush({});
  });

  it.each([
    ['latitude', 91, 0],
    ['longitude', 0, 181],
  ])('deve rejeitar %s fora do intervalo válido', (coordinate, latitude, longitude) => {
    let error: Error | undefined;

    service.getCurrentWeather(latitude, longitude).subscribe({
      error: (requestError: Error) => {
        error = requestError;
      },
    });

    expect(error?.message).toContain(coordinate);
    httpTesting.expectNone('https://api.open-meteo.com/v1/forecast');
  });
});