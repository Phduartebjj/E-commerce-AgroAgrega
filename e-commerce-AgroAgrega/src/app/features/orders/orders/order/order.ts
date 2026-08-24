import { Component, input } from '@angular/core';
import { OrderModel } from '@models/order';
import { PrecoFormatadoPipe } from '../../../../shared/pipes/preco-formatado-pipe';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-order',
  imports: [PrecoFormatadoPipe, DatePipe],
  templateUrl: './order.html',
  styleUrl: './order.css',
})
export class OrderComponent {
  order = input.required<OrderModel>();
}
