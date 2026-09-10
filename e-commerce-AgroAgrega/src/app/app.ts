import { Component, OnInit, signal } from '@angular/core';

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
export class App implements OnInit {
  protected readonly title = signal('e-commerce-AgroAgrega');

  mostrarHeader = signal(true);
  mostrarFooter = signal(true);

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {
    this.atualizarLayout();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.atualizarLayout();
      });
  }

  ngOnInit(): void {
    this.atualizarLayout();
  }

  private atualizarLayout(): void {
    let rotaAtual = this.activatedRoute;

    while (rotaAtual.firstChild) {
      rotaAtual = rotaAtual.firstChild;
    }

    const dadosDaRota = rotaAtual.snapshot?.data ?? {};

    const esconderHeader = Boolean(dadosDaRota['hideHeader']);
    const esconderFooter = Boolean(dadosDaRota['hideFooter']);

    this.mostrarHeader.set(!esconderHeader);
    this.mostrarFooter.set(!esconderFooter);
  }
}