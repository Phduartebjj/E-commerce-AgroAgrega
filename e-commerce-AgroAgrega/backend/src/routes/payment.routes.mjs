import express from 'express';

export function createPaymentRouter(paymentService) {
  const router = express.Router();

  router.post('/', async (req, res) => {
    try {
      const { totalAmount } = req.body;

      const payment = await paymentService.createTestOrder(totalAmount);

      return res.status(201).json(payment);
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      console.error('Status:', error.status);
      console.error('Causas:', error.causes);

      return res.status(error.status || 500).json({
        message: 'Não foi possível criar o pagamento.',
        error: error.message,
        causes: error.causes,
      });
    }
  });

  router.get('/:orderId', async (req, res) => {
    try {
      const order = await paymentService.getOrder(req.params.orderId);

      return res.json(order);
    } catch (error) {
      console.error('Erro ao consultar pagamento:', error);

      return res.status(error.status || 500).json({
        message: 'Não foi possível consultar o pagamento.',
        error: error.message,
      });
    }
  });

  return router;
}