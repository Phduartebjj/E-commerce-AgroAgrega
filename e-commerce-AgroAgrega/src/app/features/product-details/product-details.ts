import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router'; // Serviço para acessar dados da URL

@Component({
  selector: 'app-product-details',
  imports: [],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails {
  private route = inject(ActivatedRoute); // coleta instância da rota atual
  id = this.route.snapshot.paramMap.get('id');
}
