import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  effect,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  catchError,
  exhaustMap,
  filter,
  finalize,
  of,
  take,
  takeWhile,
  timer,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { OrderService } from '@core/services/order/order.service';
import { PaymentApiService } from '@core/services/payment-api.service';
import { OrderStatus } from '@models/order';

import { OrderComponent } from './order/order';

@Component({
  selector: 'app-orders',
  imports: [OrderComponent, RouterLink],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders {
  private readonly orderService = inject(OrderService);
  private readonly paymentApiService = inject(PaymentApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  private readonly syncingPaymentIds = new Set<string>();

  protected readonly orders = this.orderService.getOrders();

  protected readonly paymentStatus =
    this.route.snapshot.queryParamMap.get('payment');

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    effect(() => {
      const orders = this.orders();

      if (!orders.length) {
        return;
      }

      this.syncPendingPayments();
    });
  }

  private syncPendingPayments(): void {
    const pendingOrders = this.orders().filter(
      (order) =>
        order.status === OrderStatus.Pending &&
        !!order.mercadoPagoOrderId,
    );

    for (const order of pendingOrders) {
      const mercadoPagoOrderId = order.mercadoPagoOrderId;

      if (!mercadoPagoOrderId) {
        continue;
      }

      if (this.syncingPaymentIds.has(mercadoPagoOrderId)) {
        continue;
      }

      this.syncingPaymentIds.add(mercadoPagoOrderId);

      timer(0, 2000)
        .pipe(
          take(60),

          exhaustMap(() =>
            this.paymentApiService
              .consultarPedido(mercadoPagoOrderId)
              .pipe(
                catchError((error) => {
                  console.error(
                    '[Mercado Pago] Erro ao consultar pedido:',
                    mercadoPagoOrderId,
                    error,
                  );

                  return of(null);
                }),
              ),
          ),

          filter((payment) => payment !== null),

          takeWhile(
            (payment) => {
              const confirmed =
                payment.status === 'processed' &&
                payment.statusDetail === 'accredited';

              console.log(
                '[Mercado Pago] Status do pedido:',
                mercadoPagoOrderId,
                {
                  status: payment.status,
                  statusDetail: payment.statusDetail,
                  confirmed,
                },
              );

              return !confirmed;
            },
            true,
          ),

          finalize(() => {
            this.syncingPaymentIds.delete(mercadoPagoOrderId);

            console.log(
              '[Mercado Pago] Fim da sincronização:',
              mercadoPagoOrderId,
            );
          }),

          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (payment) => {
            if (
              payment.status === 'processed' &&
              payment.statusDetail === 'accredited'
            ) {
              console.log(
                '[Mercado Pago] Pagamento confirmado! Atualizando pedido:',
                mercadoPagoOrderId,
              );

              this.orderService.updateOrderStatusByMercadoPagoId(
                mercadoPagoOrderId,
                OrderStatus.Confirmed,
              );
            }
          },
        });
    }
  }
}