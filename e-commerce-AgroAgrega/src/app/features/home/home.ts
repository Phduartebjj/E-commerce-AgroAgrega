import { Component } from '@angular/core';
import {Hero} from './components/hero/hero'
import { Benefits } from './components/benefits/benefits';
import { Footer } from '../../shared/components/footer/footer';
import { ProductCarousel } from './components/product-carousel/product-carousel';

@Component({
  selector: 'app-home',
  imports: [Hero, Benefits,ProductCarousel],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
