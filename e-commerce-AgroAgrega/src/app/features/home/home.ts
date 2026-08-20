import { Component } from '@angular/core';
import {Hero} from './components/hero/hero'
import { Benefits } from './components/benefits/benefits';


@Component({
  selector: 'app-home',
  imports: [Hero, Benefits,],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
