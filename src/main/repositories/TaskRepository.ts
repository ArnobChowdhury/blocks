/*
 * Blocks Tracker - Todoing and habit tracking in one place.
 * Copyright (C) 2025 Chowdhury Md Sami Al Muntahi
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
// eslint-disable-next-line import/no-relative-packages
import { Prisma, PrismaClient, Task } from '../../generated/client';
import {
  ITaskIPC,
  TaskCompletionStatusEnum,
  TaskScheduleTypeEnum,
} from '../../renderer/types';
import { getTodayEnd, getTodayStart } from '../helpers';
import { prisma } from '../prisma';

type PrismaTransactionalClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class TaskRepository {
  createTask = async (
    taskData: ITaskIPC,
    userId: string | null,
    tx?: PrismaTransactionalClient,
  ): Promise<Task> => {
    const {
      title,
      description,
      schedule,
      dueDate,
      shouldBeScored,
      timeOfDay,
      spaceId,
    } = taskData;

    const db = tx || prisma;

    return db.task.create({
      data: {
        title,
        description,
        schedule,
        dueDate,
        shouldBeScored,
        timeOfDay,
        spaceId,
        userId,
      },
    });
  };

  updateTask = async (
    taskId: string,
    taskData: ITaskIPC,
    userId: string | null,
    tx?: PrismaTransactionalClient,
  ): Promise<Task> => {
    const {
      title,
      description,
      dueDate,
      shouldBeScored,
      timeOfDay,
      completionStatus,
      spaceId,
    } = taskData;

    const db = tx || prisma;

    return db.task.update({
      where: { id: taskId, userId },
      data: {
        title,
        description,
        dueDate,
        shouldBeScored,
        timeOfDay,
        completionStatus,
        spaceId,
      },
    });
  };

  getTasksForToday = async (userId: string | null): Promise<Task[]> => {
    const todayStart = getTodayStart();
    const todayEnd = getTodayEnd();

    return prisma.task.findMany({
      where: {
        userId,
        dueDate: {
          gte: todayStart,
          lte: todayEnd,
        },
        completionStatus: {
          not: TaskCompletionStatusEnum.FAILED,
        },
      },
      include: {
        // Assuming you might need tags in the renderer
        tags: true,
      },
    });
  };

  getOverdueTasks = async (userId: string | null): Promise<Task[]> => {
    const todayStart = getTodayStart();

    return prisma.task.findMany({
      where: {
        userId,
        dueDate: {
          lt: todayStart,
        },
        completionStatus: TaskCompletionStatusEnum.INCOMPLETE,
      },
    });
  };

  updateTaskCompletionStatus = async (
    taskId: string,
    status: TaskCompletionStatusEnum,
    score: number | null | undefined,
    userId: string | null,
    tx?: PrismaTransactionalClient,
  ): Promise<Task> => {
    const db = tx || prisma;

    return db.task.update({
      where: {
        id: taskId,
        userId,
      },
      data: {
        completionStatus: status,
        score,
      },
    });
  };

  failTask = async (
    taskId: string,
    userId: string | null,
    tx?: PrismaTransactionalClient,
  ): Promise<Task> => {
    const db = tx || prisma;

    return db.task.update({
      where: {
        id: taskId,
        userId,
      },
      data: {
        completionStatus: TaskCompletionStatusEnum.FAILED,
      },
    });
  };

  deactivateCompletedOnceTasks = async (
    userId: string | null,
    tx?: PrismaTransactionalClient,
  ): Promise<void> => {
    const todayStart = getTodayStart();

    const db = tx || prisma;

    await db.task.updateMany({
      where: {
        userId,
        isActive: true,
        schedule: TaskScheduleTypeEnum.Once,
        dueDate: {
          lt: todayStart,
        },
        completionStatus: TaskCompletionStatusEnum.COMPLETE,
      },
      data: {
        isActive: false,
      },
    });
  };

  getAllActiveOnceTasks = async (userId: string | null): Promise<Task[]> => {
    return prisma.task.findMany({
      where: {
        userId,
        isActive: true,
        schedule: TaskScheduleTypeEnum.Once,
        completionStatus: TaskCompletionStatusEnum.INCOMPLETE,
      },
      include: {
        tags: true,
      },
    });
  };

  getAllActiveUnscheduledTasks = async (
    userId: string | null,
  ): Promise<Task[]> => {
    return prisma.task.findMany({
      where: {
        userId,
        isActive: true,
        schedule: TaskScheduleTypeEnum.Unscheduled,
        completionStatus: TaskCompletionStatusEnum.INCOMPLETE,
      },
      include: {
        tags: true,
      },
    });
  };

  getTaskById = async (
    taskId: string,
    userId: string | null,
  ): Promise<Task | null> => {
    return prisma.task.findUnique({
      where: { id: taskId, userId },
    });
  };

  rescheduleTask = async (
    taskId: string,
    dueDate: string,
    newSchedule: TaskScheduleTypeEnum | undefined,
    userId: string | null,
    tx?: PrismaTransactionalClient,
  ): Promise<Task> => {
    const data: { dueDate: string; schedule?: TaskScheduleTypeEnum } = {
      dueDate,
    };
    if (newSchedule) {
      data.schedule = newSchedule;
    }

    const db = tx || prisma;

    return db.task.update({
      where: { id: taskId, userId },
      data,
    });
  };

  bulkFailTasks = async (
    taskIds: string[],
    userId: string | null,
    tx?: PrismaTransactionalClient,
  ): Promise<{ count: number }> => {
    const db = tx || prisma;

    return db.task.updateMany({
      where: {
        id: {
          in: taskIds,
        },
        userId,
      },
      data: {
        completionStatus: TaskCompletionStatusEnum.FAILED,
      },
    });
  };

  getTaskDetails = async (
    taskId: string,
    userId: string | null,
  ): Promise<Task> => {
    return prisma.task.findFirstOrThrow({
      where: {
        id: taskId,
        userId,
      },
      include: {
        tags: true,
        space: true,
      },
    });
  };

  getActiveUnscheduledTasksWithSpaceId = async (
    spaceId: string,
    userId: string | null,
  ): Promise<Task[]> => {
    return prisma.task.findMany({
      where: {
        spaceId,
        userId,
        isActive: true,
        completionStatus: TaskCompletionStatusEnum.INCOMPLETE,
        schedule: TaskScheduleTypeEnum.Unscheduled,
      },
    });
  };

  getActiveOnceTasksWithSpaceId = async (
    spaceId: string,
    userId: string | null,
  ): Promise<Task[]> => {
    return prisma.task.findMany({
      where: {
        spaceId,
        userId,
        isActive: true,
        completionStatus: TaskCompletionStatusEnum.INCOMPLETE,
        schedule: TaskScheduleTypeEnum.Once,
      },
    });
  };

  getActiveUnscheduledTasksWithoutSpace = async (
    userId: string | null,
  ): Promise<Task[]> => {
    return prisma.task.findMany({
      where: {
        spaceId: null,
        userId,
        isActive: true,
        completionStatus: TaskCompletionStatusEnum.INCOMPLETE,
        schedule: TaskScheduleTypeEnum.Unscheduled,
      },
      include: {
        tags: true,
      },
    });
  };

  getActiveOnceTasksWithoutSpace = async (
    userId: string | null,
  ): Promise<Task[]> => {
    return prisma.task.findMany({
      where: {
        spaceId: null,
        userId,
        isActive: true,
        completionStatus: TaskCompletionStatusEnum.INCOMPLETE,
        schedule: TaskScheduleTypeEnum.Once,
      },
      include: {
        tags: true,
      },
    });
  };

  upsertMany = async (
    tasks: Task[],
    tx: PrismaTransactionalClient,
  ): Promise<void> => {
    if (tasks.length === 0) {
      return;
    }

    const upsertPromises = tasks.map((task) => {
      const { id, ...taskData } = task;
      return tx.task.upsert({
        where: { id },
        create: {
          id,
          ...taskData,
        },
        update: {
          ...taskData,
        },
      });
    });

    await Promise.all(upsertPromises);
  };
}
