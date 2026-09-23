import express from 'express';
import { createPaymentRouter } from './routes/payment.routes.mjs';
import { createWebhookRouter } from './routes/webhook.routes.mjs';
import { PaymentService } from './services/payment.service.mjs';
import { MercadoPagoConfig } from 'mercadopago';

const app = express();

const PORT = process.env.PORT || 3000;

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error(
    'MERCADOPAGO_ACCESS_TOKEN não foi configurado no arquivo .env',
  );
}

const mercadoPago = new MercadoPagoConfig({
  accessToken,
  options: { timeout: 5000 },
});

const paymentService = new PaymentService(mercadoPago);

app.use(express.json());

const allowedOrigins = [
  'http://localhost:4200',
  'https://phduartebjj.github.io',
  'https://monitoring-negotiations-raleigh-propecia.trycloudflare.com',
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use('/api/payments', createPaymentRouter(paymentService));
app.use('/api/payments/webhook', createWebhookRouter());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API AgroAgrega funcionando',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API AgroAgrega rodando em http://localhost:${PORT}`);
  console.log('Mercado Pago configurado com credencial de teste.');
});