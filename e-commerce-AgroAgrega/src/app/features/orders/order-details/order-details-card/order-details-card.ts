import { Component, input } from '@angular/core';
import { OrderItemModel, OrderModel } from '@models/order';
import { PrecoFormatadoPipe } from '@shared/pipes/preco-formatado-pipe';

@Component({
  selector: 'app-order-details-card',
  imports: [PrecoFormatadoPipe],
  templateUrl: './order-details-card.html',
  styleUrl: './order-details-card.css',
})
export class OrderDetailsCard {
  item = input.required<OrderItemModel>();
}
