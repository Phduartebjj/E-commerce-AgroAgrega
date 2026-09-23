import { Component, inject, computed, OnInit, signal } from '@angular/core';

import { WeatherResponse } from '@models/weather';

import { Hero } from './components/hero/hero';
import { Benefits } from './components/benefits/benefits';
import { ProductCarousel } from './components/product-carousel/product-carousel';

import { ProductService } from '@core/services/product/product.service';

import { WeatherService } from '@core/services/weather/weather.service';

@Component({
  selector: 'app-home',
  imports: [Hero, Benefits, ProductCarousel],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  readonly weather = signal<WeatherResponse | null>(null);

  readonly weatherLoading = signal(true);

  readonly errorWeather = signal(false);

  private readonly productService = inject(ProductService);

  private readonly weatherService = inject(WeatherService);

  readonly produtosDestaque = this.productService.getProducts();

  readonly maisVendidos = this.productService.getDailyPopularProducts(6);

  readonly weatherCondition = computed(() => {
  const code = this.weather()?.current.weather_code;

  if (code === undefined) {
    return {
      label: 'Clima indisponível',
      icon: '🌤️',
    };
  }

  if (code === 0) {
    return {
      label: 'Céu limpo',
      icon: '☀️',
    };
  }

  if (code === 1) {
    return {
      label: 'Predominantemente limpo',
      icon: '🌤️',
    };
  }

  if (code === 2) {
    return {
      label: 'Parcialmente nublado',
      icon: '⛅',
    };
  }

  if (code === 3) {
    return {
      label: 'Nublado',
      icon: '☁️',
    };
  }

  if (code === 45 || code === 48) {
    return {
      label: 'Neblina',
      icon: '🌫️',
    };
  }

  if (
    code === 51 ||
    code === 53 ||
    code === 55 ||
    code === 56 ||
    code === 57
  ) {
    return {
      label: 'Garoa',
      icon: '🌦️',
    };
  }

  if (
    code === 61 ||
    code === 63 ||
    code === 65 ||
    code === 66 ||
    code === 67 ||
    code === 80 ||
    code === 81 ||
    code === 82
  ) {
    return {
      label: 'Chuva',
      icon: '🌧️',
    };
  }

  if (
    code === 71 ||
    code === 73 ||
    code === 75 ||
    code === 77 ||
    code === 85 ||
    code === 86
  ) {
    return {
      label: 'Neve',
      icon: '❄️',
    };
  }

  if (code === 95 || code === 96 || code === 99) {
    return {
      label: 'Tempestade',
      icon: '⛈️',
    };
  }

  return {
    label: 'Condição desconhecida',
    icon: '🌤️',
  };
});

  ngOnInit(): void {
    this.weatherService.getCurrentWeather(-22.9068, -43.1729).subscribe({
      next: (weather) => {
        this.weather.set(weather);
        this.weatherLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao obter o clima:', error);
        this.errorWeather.set(true);
        this.weatherLoading.set(false);
      },
    });
  }
}
