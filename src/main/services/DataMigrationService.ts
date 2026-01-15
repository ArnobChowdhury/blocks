import log from 'electron-log';
import { prisma } from '../prisma';

class DataMigrationService {
  async assignAnonymousDataToUser(userId: string): Promise<void> {
    log.info(
      `[DataMigrationService] Assigning anonymous data to user: ${userId}`,
    );
    try {
      await prisma.$transaction([
        prisma.task.updateMany({
          where: { userId: null },
          data: { userId },
        }),
        prisma.space.updateMany({
          where: { userId: null },
          data: { userId },
        }),
        prisma.repetitiveTaskTemplate.updateMany({
          where: { userId: null },
          data: { userId },
        }),
      ]);
    } catch (error) {
      log.error(
        '[DataMigrationService] Failed to assign anonymous data:',
        error,
      );
      throw error;
    }
  }

  async hasAnonymousData(): Promise<boolean> {
    log.info('[DataMigrationService] Checking for anonymous data.');
    try {
      const [anonymousTask, anonymousSpace, anonymousTemplate] =
        await Promise.all([
          prisma.task.findFirst({
            where: { userId: null },
            select: { id: true },
          }),
          prisma.space.findFirst({
            where: { userId: null },
            select: { id: true },
          }),
          prisma.repetitiveTaskTemplate.findFirst({
            where: { userId: null },
            select: { id: true },
          }),
        ]);

      const hasData =
        !!anonymousTask || !!anonymousSpace || !!anonymousTemplate;
      log.info(`[DataMigrationService] Anonymous data found: ${hasData}`);
      return hasData;
    } catch (error) {
      log.error(
        '[DataMigrationService] Failed to check for anonymous data:',
        error,
      );
      return false;
    }
  }

  async queueAllDataForSync(userId: string): Promise<void> {
    log.info(
      `[DataMigrationService] Queuing all data for sync for user: ${userId}`,
    );

    try {
      await prisma.$transaction(async (tx) => {
        const spaces = await tx.space.findMany({
          where: { userId },
        });

        for (const space of spaces) {
          await tx.pendingOperation.create({
            data: {
              userId,
              operationType: 'create',
              entityType: 'space',
              entityId: space.id,
              payload: JSON.stringify(space),
            },
          });
        }

        const templates = await tx.repetitiveTaskTemplate.findMany({
          where: { userId },
        });

        for (const template of templates) {
          await tx.pendingOperation.create({
            data: {
              userId,
              operationType: 'create',
              entityType: 'repetitive_task_template',
              entityId: template.id,
              payload: JSON.stringify({ ...template, tags: [] }),
            },
          });
        }

        const tasks = await tx.task.findMany({
          where: { userId },
        });
        log.info(`[DataMigrationService] Found ${tasks.length} tasks.`);

        for (const task of tasks) {
          log.info(`[DataMigrationService] Queuing task: ${task.id}`);
          await tx.pendingOperation.create({
            data: {
              userId,
              operationType: 'create',
              entityType: 'task',
              entityId: task.id,
              payload: JSON.stringify({ ...task, tags: [] }),
            },
          });
        }
      });
      log.info('[DataMigrationService] All data queued for sync.');
    } catch (error) {
      log.error('[DataMigrationService] Failed to queue data for sync:', error);
      throw error;
    }
  }
}

export const dataMigrationService = new DataMigrationService();
