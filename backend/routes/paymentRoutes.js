/**
 * Payment Routes - Express router for Kerjasana Payment Gateway
 */

const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');

router.post('/payments/checkout', async (req, res) => {
  try {
    const { jobId, paymentType, amount } = req.body;
    const userId = req.user ? req.user.id : "demo-user";
    const result = await paymentService.processCheckout({ userId, jobId, paymentType, amount });
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.get('/payments/history', async (req, res) => {
  try {
    const userId = req.user ? req.user.id : "demo-user";
    const transactions = await paymentService.getTransactionHistory(userId);
    return res.json({ transactions });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
