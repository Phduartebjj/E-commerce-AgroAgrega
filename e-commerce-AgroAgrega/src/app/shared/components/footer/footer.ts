import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  signal,
  ViewChild,
} from '@angular/core';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer implements AfterViewInit {
  mostrarBotaoVoltarAoTopo = signal(false);

  @ViewChild('footerRoot')
  footer!: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    this.verificarFooter();
  }

  @HostListener('window:scroll')
  verificarFooter(): void {
    if (!this.footer) {
      return;
    }

    const footerTop = this.footer.nativeElement.getBoundingClientRect().top;

    const footerEntrouNaTela = footerTop <= window.innerHeight;

    this.mostrarBotaoVoltarAoTopo.set(footerEntrouNaTela);
  }

  voltarAoTopo(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}
