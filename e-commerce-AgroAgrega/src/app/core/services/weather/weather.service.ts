import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WeatherResponse } from '@models/weather';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'https://api.open-meteo.com/v1/forecast';

  getCurrentWeather(latitude: number, longitude: number): Observable<WeatherResponse> {
    const params = new HttpParams()
      .set('latitude', latitude)
      .set('longitude', longitude)
      .set(
        'current',
        'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
      )
      .set('timezone', 'auto');
    return this.http.get<WeatherResponse>(this.apiUrl, { params });
  }
}
