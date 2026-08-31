const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.user.updateMany({ data: { isVerified: true } })
  .then(console.log)
  .finally(() => prisma.$disconnect());
