require('dotenv').config();
const { Queue, QueueScheduler, Worker } = require('bullmq');
const IORedis = require('ioredis');
const prisma = require('../prismaClient');
const { fetchHashprice } = require('../services/hashprice');
const dayjs = require('dayjs');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
const queueName = 'payouts';
const queue = new Queue(queueName, { connection });
new QueueScheduler(queueName, { connection });

async function scheduleDaily() {
  await queue.add('daily-payout', {}, { repeat: { cron: '0 2 * * *' } });
}

async function processPayoutJob(job) {
  console.log('Payout job started', new Date());
  const hashprice = await fetchHashprice();
  const today = dayjs().startOf('day').toDate();

  const activeContracts = await prisma.contract.findMany({
    where: {
      status: 'active',
      startDate: { lte: new Date() },
      endDate: { gte: new Date() }
    },
    include: { machine: true, user: true }
  });

  for (const c of activeContracts) {
    try {
      const grossBtc = hashprice * c.machine.hashrateTh * 1;
      const maintenanceBtc = (c.machine.maintenanceUsdPerDay * 1) / (process.env.MOCK_BTC_USD || 40000);
      const netBtc = grossBtc * (1 - c.machine.poolFeePct) - maintenanceBtc;

      await prisma.dailyEarning.create({ data: {
        contractId: c.id,
        date: today,
        grossBtc: grossBtc,
        netBtc: netBtc,
        hashpriceBtcPerThPerDay: hashprice
      }});

      await prisma.user.update({ where: { id: c.userId }, data: { balanceBtc: { increment: netBtc } } });

    } catch (err) {
      console.error('Failed to process contract', c.id, err);
    }
  }

  console.log('Payout job finished');
}

const worker = new Worker(queueName, async job => {
  if (job.name === 'daily-payout') {
    await processPayoutJob(job);
  }
}, { connection });

worker.on('completed', job => console.log('Job completed', job.id));
worker.on('failed', (job, err) => console.error('Job failed', job.id, err));

(async ()=>{
  console.log('Scheduling daily payouts...');
  await scheduleDaily();
})();
