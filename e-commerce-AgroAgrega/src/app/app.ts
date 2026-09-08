import { Component, signal } from '@angular/core';

import { RouterOutlet, ActivatedRoute, NavigationEnd, Router } from '@angular/router';

import { filter } from 'rxjs';

import { Header } from './shared/components/header/header';

import { Footer } from './shared/components/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('e-commerce-AgroAgrega');

  mostrarHeader = signal(false);
  mostrarFooter = signal(false);

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.atualizarLayout();
      });
  }

  private atualizarLayout(): void {
    let rotaAtual = this.activatedRoute;

    while (rotaAtual.firstChild) {
      rotaAtual = rotaAtual.firstChild;
    }

    const dadosDaRota = rotaAtual.snapshot.data;

    const esconderHeader = dadosDaRota['hideHeader'];
    const esconderFooter = dadosDaRota['hideFooter'];

    this.mostrarHeader.set(!esconderHeader);
    this.mostrarFooter.set(!esconderFooter);
  }
}