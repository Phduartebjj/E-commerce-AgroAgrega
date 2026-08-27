import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '@core/services/order/order.service';
import { PrecoFormatadoPipe } from '@shared/pipes/preco-formatado-pipe';
@Component({
  selector: 'app-order-details',
  imports: [RouterLink, DatePipe, PrecoFormatadoPipe],

  templateUrl: './order-details.html',
  styleUrl: './order-details.css',
})
export class OrderDetails {
  private readonly route = inject(ActivatedRoute);

  private readonly OrderService = inject(OrderService);

  readonly orderId = this.route.snapshot.paramMap.get('id');

  readonly order = computed(() => {
    if(!this.orderId) {
      return undefined;
    }

    return this.OrderService.getOrderById(this.orderId);
  });


}
