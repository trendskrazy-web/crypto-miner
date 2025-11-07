const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.machine.upsert({
    where: { name: 'Small Miner' },
    update: {},
    create: {
      name: 'Small Miner',
      hashrateTh: 10,
      priceUsdPerDay: 5,
      maintenanceUsdPerDay: 0.5,
      poolFeePct: 0.02
    }
  });

  await prisma.machine.upsert({
    where: { name: 'Pro Miner' },
    update: {},
    create: {
      name: 'Pro Miner',
      hashrateTh: 100,
      priceUsdPerDay: 40,
      maintenanceUsdPerDay: 4,
      poolFeePct: 0.02
    }
  });
}

main().then(()=>{ console.log('seed done'); process.exit(0); }).catch(e=>{ console.error(e); process.exit(1); });
