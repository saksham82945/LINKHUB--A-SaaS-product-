const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Test@1234', 12);

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email: 'test@linkport.io' } });
  if (existing) {
    console.log('Test user already exists!');
    console.log('Email:    test@linkport.io');
    console.log('Password: Test@1234');
    return;
  }

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: 'Test User',
        email: 'test@linkport.io',
        passwordHash,
        isVerified: true,
        plan: 'FREE',
        role: 'USER',
      },
    });

    await tx.profile.create({
      data: {
        username: 'testuser',
        displayName: 'Test User',
        ownerUserId: newUser.id,
      },
    });

    return newUser;
  });

  console.log('\n✅ Test user created successfully!\n');
  console.log('─────────────────────────────────');
  console.log('  Email:    test@linkport.io');
  console.log('  Password: Test@1234');
  console.log('  Username: testuser');
  console.log('  Plan:     FREE');
  console.log('─────────────────────────────────\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
