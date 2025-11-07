const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');
const Coinbase = require('coinbase-commerce-node');
const prisma = require('../prismaClient');

Coinbase.Client.init(process.env.COINBASE_COMMERCE_API_KEY || '');

// Create Stripe Checkout session
router.post('/stripe/create-session', async (req, res) => {
  const { userId, machineId, days, successUrl, cancelUrl } = req.body;
  const machine = await prisma.machine.findUnique({ where: { id: machineId } });
  if (!machine) return res.status(404).json({ error: 'Machine not found' });

  const amountUsd = machine.priceUsdPerDay * Number(days);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price_data: { currency: 'usd', product_data: { name: machine.name }, unit_amount: Math.round(amountUsd * 100) }, quantity: 1 }],
    mode: 'payment',
    success_url: successUrl || `${process.env.FRONTEND_URL}/success`,
    cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/cancel`,
    metadata: { userId, machineId, days: String(days) }
  });

  res.json({ url: session.url });
});

// Stripe webhook
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature error', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, machineId, days } = session.metadata || {};
    const machine = await prisma.machine.findUnique({ where: { id: machineId } });
    const start = new Date();
    const end = new Date(start.getTime() + Number(days) * 24*60*60*1000);
    await prisma.contract.create({ data: {
      userId,
      machineId,
      startDate: start,
      endDate: end,
      days: Number(days),
      paidAmountUsd: machine.priceUsdPerDay * Number(days),
      status: 'active'
    }});
  }

  res.json({ received: true });
});

// Coinbase Commerce create charge
router.post('/coinbase/create-charge', async (req, res) => {
  const { userId, machineId, days, successUrl, cancelUrl } = req.body;
  const machine = await prisma.machine.findUnique({ where: { id: machineId } });
  if (!machine) return res.status(404).json({ error: 'Machine not found' });
  const amountUsd = machine.priceUsdPerDay * Number(days);
  const Charge = require('coinbase-commerce-node').resources.Charge;
  const chargeData = {
    name: `Contract ${machine.name}`,
    description: `Buy ${days} days of ${machine.name}`,
    local_price: { amount: amountUsd.toFixed(2), currency: 'USD' },
    metadata: { userId, machineId, days: String(days) },
    redirect_url: successUrl || `${process.env.FRONTEND_URL}/success`,
    cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/cancel`
  };

  const charge = await Charge.create(chargeData);
  res.json({ hosted_url: charge.hosted_url, charge });
});

module.exports = router;
