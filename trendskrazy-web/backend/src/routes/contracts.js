const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// create a contract (buy)
router.post('/', async (req, res) => {
  const { userId, machineId, days } = req.body;
  if (!userId || !machineId || !days) return res.status(400).json({ error: 'Missing fields' });
  const machine = await prisma.machine.findUnique({ where: { id: machineId } });
  if (!machine) return res.status(404).json({ error: 'Machine not found' });

  const start = new Date();
  const end = new Date(start.getTime() + days * 24*60*60*1000);
  const paid = machine.priceUsdPerDay * days;

  const contract = await prisma.contract.create({
    data: {
      userId,
      machineId,
      startDate: start,
      endDate: end,
      days: Number(days),
      paidAmountUsd: paid,
      status: 'active'
    }
  });

  res.status(201).json(contract);
});

// estimate payout for a contract (uses current hashprice)
router.get('/:id/estimate', async (req, res) => {
  const id = req.params.id;
  const contract = await prisma.contract.findUnique({ where: { id }, include: { machine: true } });
  if (!contract) return res.status(404).json({ error: 'Not found' });

  // fetch hashprice
  const { fetchHashprice } = require('../services/hashprice');
  const hashprice = await fetchHashprice();

  const grossBtc = hashprice * contract.machine.hashrateTh * contract.days;
  const maintenanceBtc = (contract.machine.maintenanceUsdPerDay * contract.days) / (process.env.MOCK_BTC_USD || 40000);
  const netBtc = grossBtc * (1 - contract.machine.poolFeePct) - maintenanceBtc;

  res.json({ contractId: id, grossBtc, netBtc, hashprice });
});

module.exports = router;
