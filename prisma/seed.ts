import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FamilyTask database...');

  // Hash passwords
  const parentPassword = await bcrypt.hash('parent123', 10);
  const childPassword = await bcrypt.hash('child123', 10);

  // Create parent user
  const parent = await prisma.user.upsert({
    where: { email: 'parent@familytask.com' },
    update: {},
    create: {
      email: 'parent@familytask.com',
      name: 'Parent User',
      password: parentPassword,
      role: 'PARENT',
      points: 0,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Parent&backgroundColor=00C2E0',
    },
  });

  // Create child user
  const child = await prisma.user.upsert({
    where: { email: 'child@familytask.com' },
    update: {},
    create: {
      email: 'child@familytask.com',
      name: 'Child User',
      password: childPassword,
      role: 'CHILD',
      points: 50,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Child&backgroundColor=00C2E0',
    },
  });

  console.log(`✅ Created users: ${parent.name}, ${child.name}`);

  // Create some tasks
  const tasks = await prisma.task.createMany({
    data: [
      {
        title: 'Clean Room',
        description: 'Tidy up your bedroom, make bed, organize toys',
        points: 15,
        completed: true,
        completedAt: new Date(Date.now() - 86400000), // Yesterday
        assignedToId: child.id,
        createdById: parent.id,
      },
      {
        title: 'Homework',
        description: 'Complete math homework for school',
        points: 20,
        completed: true,
        completedAt: new Date(Date.now() - 43200000), // 12 hours ago
        assignedToId: child.id,
        createdById: parent.id,
      },
      {
        title: 'Hockey Practice',
        description: 'Attend hockey practice session',
        points: 25,
        completed: false,
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
        assignedToId: child.id,
        createdById: parent.id,
      },
      {
        title: 'Walk the Dog',
        description: 'Take the dog for a 30-minute walk',
        points: 10,
        completed: false,
        dueDate: new Date(Date.now() + 43200000), // 12 hours from now
        assignedToId: child.id,
        createdById: parent.id,
      },
      {
        title: 'Set Table',
        description: 'Set the table for dinner',
        points: 5,
        completed: false,
        assignedToId: child.id,
        createdById: parent.id,
      },
    ],
  });

  console.log(`✅ Created ${tasks.count} tasks`);

  // Create some rewards
  const rewards = await prisma.reward.createMany({
    data: [
      {
        name: 'Ice Cream Trip',
        description: 'A special trip to your favorite ice cream shop',
        points: 50,
        icon: 'fas fa-ice-cream',
        createdById: parent.id,
      },
      {
        name: 'Movie Night Pick',
        description: 'You get to choose the movie for family movie night',
        points: 75,
        icon: 'fas fa-film',
        createdById: parent.id,
      },
      {
        name: 'New Book',
        description: 'Pick out a brand new book of your choice',
        points: 100,
        icon: 'fas fa-book',
        createdById: parent.id,
      },
      {
        name: 'Video Game Hour',
        description: 'One hour of extra video game time',
        points: 30,
        icon: 'fas fa-gamepad',
        createdById: parent.id,
      },
      {
        name: 'Pizza Night Choice',
        description: 'Choose the pizza toppings for family pizza night',
        points: 40,
        icon: 'fas fa-pizza-slice',
        createdById: parent.id,
      },
      {
        name: 'Stay Up Late',
        description: 'Stay up 30 minutes past bedtime',
        points: 25,
        icon: 'fas fa-moon',
        createdById: parent.id,
      },
    ],
  });

  console.log(`✅ Created ${rewards.count} rewards`);

  // Find the video game reward
  const videoGameReward = await prisma.reward.findFirst({
    where: { name: 'Video Game Hour' }
  });

  if (videoGameReward) {
    // Create a pending reward request
    await prisma.rewardRequest.create({
      data: {
        rewardId: videoGameReward.id,
        userId: child.id,
        status: 'PENDING',
      },
    });
    console.log(`✅ Created 1 pending reward request`);
  }

  console.log('🎉 Database seeding completed!');
  console.log('\n🔑 Test Credentials:');
  console.log('Parent: parent@familytask.com / parent123');
  console.log('Child: child@familytask.com / child123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
