import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '@core/services/order/order.service';
import { PrecoFormatadoPipe } from '@shared/pipes/preco-formatado-pipe';
import { OrderDetailsCard } from './order-details-card/order-details-card';
import { ReceiptService } from '@core/services/receipt/receipt';

@Component({
  selector: 'app-order-details',
  imports: [DatePipe, PrecoFormatadoPipe, OrderDetailsCard],
  templateUrl: './order-details.html',
  styleUrl: './order-details.css',
})
export class OrderDetails {
  receiptService = inject(ReceiptService);

  generateReceipt() {
    const order = this.order();

    if (!order) {
      return;
    }

    this.receiptService.generateReceipt(order);
  }

  cancelOrder(orderId: string) {
    this.OrderService.cancelOrder(orderId);
  }

  private readonly route = inject(ActivatedRoute);

  private readonly OrderService = inject(OrderService);

  readonly orderId = this.route.snapshot.paramMap.get('id');

  readonly order = computed(() => {
    if (!this.orderId) {
      return undefined;
    }

    return this.OrderService.getOrderById(this.orderId);
  });
}
