import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { WeatherResponse } from '@models/weather';

const CURRENT_WEATHER_FIELDS =
  'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'https://api.open-meteo.com/v1/forecast';

  getCurrentWeather(latitude: number, longitude: number): Observable<WeatherResponse> {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return throwError(() => new Error('Latitude deve estar entre -90 e 90.'));
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return throwError(() => new Error('Longitude deve estar entre -180 e 180.'));
    }

    const params = new HttpParams()
      .set('latitude', latitude)
      .set('longitude', longitude)
      .set('current', CURRENT_WEATHER_FIELDS)
      .set('timezone', 'auto');
    return this.http.get<WeatherResponse>(this.apiUrl, { params });
  }
}
