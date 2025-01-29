// import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

// const prisma = new PrismaClient();
import { prisma } from './prisma';

async function createTasks() {
  const tasks = [];

  // Create 30 tasks for each day in the last 30 days
  for (let i = 0; i < 6; i += 1) {
    const date = dayjs().subtract(i, 'day').toDate(); // Get the date for the last 30 days
    const title = 'Laundry';

    // Push the task creation promise into the tasks array
    tasks.push(
      prisma.task.create({
        data: {
          title,
          isActive: true,
          schedule: 'Specific Days in a Week', // You can modify based on your logic
          dueDate: date,
          createdAt: date,
          modifiedAt: date,
          priority: 3, // Default priority, you can customize
          completionStatus: 'COMPLETE',
          shouldBeScored: true, // Set according to your logic
          score: 4,
          timeOfDay: 'Morning', // Modify as per your use case
          repetitiveTaskTemplateId: 18,
        },
      }),
    );
  }

  // Wait for all tasks to be created concurrently
  await Promise.all(tasks);

  console.log('All tasks created!');
}

createTasks()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
