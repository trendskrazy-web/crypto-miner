require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const machinesRouter = require('./routes/machines');
const contractsRouter = require('./routes/contracts');
const paymentsRouter = require('./routes/payments');

const app = express();
app.use(bodyParser.json());

app.use('/api/machines', machinesRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/payments', paymentsRouter);

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log(`Backend listening on ${PORT}`));
