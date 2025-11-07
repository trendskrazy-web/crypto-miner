const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

router.get('/', async (req, res) => {
  const machines = await prisma.machine.findMany();
  res.json(machines);
});

module.exports = router;
