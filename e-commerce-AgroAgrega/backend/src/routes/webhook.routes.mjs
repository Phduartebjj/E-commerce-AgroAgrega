import express from 'express';
import {
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} from 'mercadopago';

export function createWebhookRouter() {
  const router = express.Router();

  router.post('/', (req, res) => {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    if (!secret) {
      console.error('MERCADOPAGO_WEBHOOK_SECRET não foi configurado.');
      return res.sendStatus(500);
    }

    try {
      WebhookSignatureValidator.validate({
        xSignature: req.headers['x-signature'],
        xRequestId: req.headers['x-request-id'],
        dataId: req.query['data.id'],
        secret,
      });

      console.log('Webhook do Mercado Pago validado com sucesso.');
      console.log('Query:', req.query);
      console.log('Body:', req.body);

      return res.sendStatus(200);
    } catch (error) {
      if (error instanceof InvalidWebhookSignatureError) {
        console.error('Assinatura do Webhook inválida.');
        return res.sendStatus(401);
      }

      console.error('Erro ao validar Webhook:', error);
      return res.sendStatus(500);
    }
  });

  return router;
}