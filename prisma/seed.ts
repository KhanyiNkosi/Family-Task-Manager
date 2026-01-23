// prisma/seed.ts - FIXED VERSION
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Create parent user - USING ID INSTEAD OF EMAIL
  const parent = await prisma.users.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'parent@familytask.com',
      // Note: You'll need to add other required fields and hash the password
      // encrypted_password: await hashPassword('yourpassword'),
    }
  });

  console.log({ parent })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
