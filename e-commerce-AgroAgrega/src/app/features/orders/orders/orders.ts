  import { Component } from '@angular/core';
  import { OrderComponent } from './order/order';
  import { inject } from '@angular/core';
  import { OrderService } from '@core/services/order/order.service';
import { RouterLink } from '@angular/router';

  @Component({
    selector: 'app-orders',
    imports: [OrderComponent, RouterLink],
    templateUrl: './orders.html',
    styleUrl: './orders.css',
  })
  export class Orders {
    private readonly orderService = inject(OrderService);

    protected readonly orders = this.orderService.getOrders()
  }
