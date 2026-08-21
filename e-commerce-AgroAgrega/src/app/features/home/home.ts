import { Component } from '@angular/core';
import {Hero} from './components/hero/hero'
import { Benefits } from './components/benefits/benefits';
import { Footer } from '../../shared/components/footer/footer';


@Component({
  selector: 'app-home',
  imports: [Hero, Benefits,Footer],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
