import { Order } from 'mercadopago';
import { randomUUID } from 'node:crypto';

export class PaymentService {
  constructor(mercadoPagoClient) {
    this.order = new Order(mercadoPagoClient);
  }

  async createTestOrder(totalAmount) {
    const normalizedAmount = this.normalizeAmount(totalAmount);

    const body = {
      type: 'online',
      processing_mode: 'manual',

      total_amount: normalizedAmount,

      external_reference: `AGROAGREGA-TEST-${Date.now()}`,

      payer: {
        email: process.env.MERCADOPAGO_TEST_PAYER_EMAIL,
      },

      description: 'Pedido AgroAgrega',

      config: {
        online: {
          success_url: `${process.env.FRONTEND_URL}/orders?payment=success`,
          failure_url: `${process.env.FRONTEND_URL}/orders?payment=failure`,
          pending_url: `${process.env.FRONTEND_URL}/orders?payment=pending`,
          auto_return: 'all',
        },
      },
    };

    const requestOptions = {
      idempotencyKey: randomUUID(),
    };

    const response = await this.order.create({
      body,
      requestOptions,
    });

    console.log('Nova Order criada no Mercado Pago:', response.id);
    console.log('Valor da Order:', response.total_amount);

    return {
      id: response.id,
      status: response.status,
      checkoutUrl: response.checkout_url,
      totalAmount: response.total_amount,
    };
  }

  async getOrder(orderId) {
    const response = await this.order.get({ id: orderId });

    return {
      id: response.id,
      status: response.status,
      statusDetail: response.status_detail,
      totalAmount: response.total_amount,
      totalPaidAmount: response.total_paid_amount,
    };
  }

  normalizeAmount(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount) || amount <= 0) {
      const error = new Error(
        'O valor do pagamento deve ser maior que zero.',
      );

      error.status = 400;

      throw error;
    }

    return amount.toFixed(2);
  }
}