import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '@core/services/order/order.service';
@Component({
  selector: 'app-order-details',
  imports: [RouterLink],

  templateUrl: './order-details.html',
  styleUrl: './order-details.css',
})
export class OrderDetails {
  private readonly route = inject(ActivatedRoute);

  private readonly OrderService = inject(OrderService);

  readonly orderId = this.route.snapshot.paramMap.get('id');

  readonly order = computed(() => {
    const id = this.orderId;

    return id ? this.OrderService.getOrderById(id) : undefined;

    
  });
}
