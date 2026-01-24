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
import dayjs from 'dayjs';
// eslint-disable-next-line import/no-relative-packages
import { Task } from '../../generated/client';
import log from 'electron-log';
import {
  ITaskIPC,
  TaskCompletionStatusEnum,
  TaskScheduleTypeEnum,
  TimeOfDay,
} from '../../renderer/types';
import { TaskRepository } from '../repositories/TaskRepository';
import { RepetitiveTaskTemplateRepository } from '../repositories/RepetitiveTaskTemplateRepository';
import { PendingOperationRepository } from '../repositories/PendingOperationRepository';
import { syncService } from './SyncService';
import { prisma } from '../prisma';
import { getNextIterationDateForRepetitiveTask } from '../../renderer/utils';

type PrismaTransactionalClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class TaskService {
  private taskRepository: TaskRepository;
  private repetitiveTaskTemplateRepository: RepetitiveTaskTemplateRepository;

  private pendingOpRepository: PendingOperationRepository;

  constructor() {
    this.taskRepository = new TaskRepository();
    this.pendingOpRepository = new PendingOperationRepository();
    this.repetitiveTaskTemplateRepository =
      new RepetitiveTaskTemplateRepository();
  }

  _createTaskInternal = async (
    taskData: ITaskIPC,
    userId: string | null,
    tx: PrismaTransactionalClient,
  ): Promise<Task> => {
    const createdTask = await this.taskRepository.createTask(
      taskData,
      userId,
      tx,
    );

    const isPremium = !!userId;
    if (isPremium) {
      await this.pendingOpRepository.enqueueOperation(
        {
          userId: userId!,
          operationType: 'create',
          entityType: 'task',
          entityId: createdTask.id,
          payload: JSON.stringify({ ...createdTask, tags: [] }), // Assuming tags are handled separately
        },
        tx,
      );
    }
    return createdTask;
  };

  createTask = async (
    taskData: ITaskIPC,
    userId: string | null,
  ): Promise<Task> => {
    const isPremium = !!userId;

    const newTask = await prisma.$transaction(async (tx) => {
      return this._createTaskInternal(taskData, userId, tx);
    });

    if (isPremium) {
      syncService.runSync(userId);
    }

    return newTask;
  };

  updateTask = async (
    taskData: ITaskIPC,
    userId: string | null,
  ): Promise<Task> => {
    const { id } = taskData;
    if (!id) {
      throw new Error('Task ID is required for an update operation.');
    }

    const isPremium = !!userId;

    const updatedTask = await prisma.$transaction(async (tx) => {
      const task = await this.taskRepository.updateTask(
        id,
        taskData,
        userId,
        tx,
      );

      if (isPremium) {
        await this.pendingOpRepository.enqueueOperation(
          {
            userId: userId!,
            operationType: 'update',
            entityType: 'task',
            entityId: task.id,
            payload: JSON.stringify({ ...task, tags: [] }),
          },
          tx,
        );
      }

      return task;
    });

    if (isPremium) {
      syncService.runSync(userId);
    }

    return updatedTask;
  };

  getTasksForDate = async (
    userId: string | null,
    date: Date,
  ): Promise<Task[]> => {
    return this.taskRepository.getTasksForDate(userId, date);
  };

  getOverdueTasks = async (userId: string | null): Promise<Task[]> => {
    return this.taskRepository.getOverdueTasks(userId);
  };

  getCountOfTasksOverdue = async (userId: string | null): Promise<number> => {
    return this.taskRepository.getCountOfTasksOverdue(userId);
  };

  toggleTaskCompletionStatus = async (
    id: string,
    status: TaskCompletionStatusEnum,
    score: number | null | undefined,
    userId: string | null,
  ): Promise<Task> => {
    const isPremium = !!userId;

    const updatedTask = await prisma.$transaction(async (tx) => {
      const task = await this.taskRepository.updateTaskCompletionStatus(
        id,
        status,
        score,
        userId,
        tx,
      );

      if (isPremium) {
        await this.pendingOpRepository.enqueueOperation(
          {
            userId: userId!,
            operationType: 'update',
            entityType: 'task',
            entityId: task.id,
            payload: JSON.stringify({ ...task, tags: [] }),
          },
          tx,
        );
      }

      return task;
    });

    if (isPremium) {
      syncService.runSync(userId);
    }

    return updatedTask;
  };

  private _failTaskInternal = async (
    taskId: string,
    userId: string | null,
    tx: PrismaTransactionalClient,
  ): Promise<Task> => {
    const task = await this.taskRepository.failTask(taskId, userId, tx);

    const isPremium = !!userId;
    if (isPremium) {
      await this.pendingOpRepository.enqueueOperation(
        {
          userId: userId!,
          operationType: 'update',
          entityType: 'task',
          entityId: task.id,
          payload: JSON.stringify({ ...task, tags: [] }),
        },
        tx,
      );
    }

    return task;
  };

  failTask = async (taskId: string, userId: string | null): Promise<Task> => {
    const isPremium = !!userId;

    const failedTask = await prisma.$transaction(async (tx) => {
      return this._failTaskInternal(taskId, userId, tx);
    });

    if (isPremium) {
      syncService.runSync(userId);
    }

    return failedTask;
  };

  getAllActiveOnceTasks = async (userId: string | null): Promise<Task[]> => {
    await this.taskRepository.deactivateCompletedOnceTasks(userId);
    return this.taskRepository.getAllActiveOnceTasks(userId);
  };

  getAllActiveUnscheduledTasks = async (
    userId: string | null,
  ): Promise<Task[]> => {
    await this.taskRepository.deactivateCompletedOnceTasks(userId);
    return this.taskRepository.getAllActiveUnscheduledTasks(userId);
  };

  rescheduleTask = async (
    taskId: string,
    dueDate: string,
    userId: string | null,
  ): Promise<Task> => {
    const task = await this.taskRepository.getTaskById(taskId, userId);

    if (!task) {
      throw new Error(`Task with ID ${taskId} not found.`);
    }

    if (task.schedule === TaskScheduleTypeEnum.Daily) {
      throw new Error('Daily tasks cannot be rescheduled.');
    }

    if (
      task.schedule === TaskScheduleTypeEnum.SpecificDaysInAWeek &&
      task.repetitiveTaskTemplateId
    ) {
      const repetitiveTaskTemplate =
        await this.repetitiveTaskTemplateRepository.getRepetitiveTaskTemplateDetails(
          task.repetitiveTaskTemplateId,
          userId,
        );

      const nextIterationDate = getNextIterationDateForRepetitiveTask(
        repetitiveTaskTemplate,
        dayjs(task.dueDate),
      );

      if (!dayjs(dueDate).isBefore(nextIterationDate)) {
        throw new Error(
          'Rescheduled due date must be before the next iteration date.',
        );
      }
    }

    let newSchedule: TaskScheduleTypeEnum | undefined;
    if (task.schedule === TaskScheduleTypeEnum.Unscheduled) {
      newSchedule = TaskScheduleTypeEnum.Once;
    }

    const isPremium = !!userId;

    const rescheduledTask = await prisma.$transaction(async (tx) => {
      const task = await this.taskRepository.rescheduleTask(
        taskId,
        dueDate,
        newSchedule,
        userId,
        tx,
      );

      if (isPremium) {
        await this.pendingOpRepository.enqueueOperation(
          {
            userId: userId!,
            operationType: 'update',
            entityType: 'task',
            entityId: task.id,
            payload: JSON.stringify({ ...task, tags: [] }),
          },
          tx,
        );
      }
      return task;
    });

    if (isPremium) {
      syncService.runSync(userId);
    }

    return rescheduledTask;
  };

  bulkFailTasks = async (
    taskIds: string[],
    userId: string | null,
  ): Promise<{ count: number }> => {
    if (!taskIds || taskIds.length === 0) {
      return { count: 0 };
    }

    const isPremium = !!userId;

    if (isPremium) {
      const failedTasks = await prisma.$transaction(async (tx) => {
        const promises = taskIds.map((id) =>
          this._failTaskInternal(id, userId, tx),
        );
        return Promise.all(promises);
      });

      syncService.runSync(userId);

      return { count: failedTasks.length };
    }

    return this.taskRepository.bulkFailTasks(taskIds, userId);
  };

  getTaskDetails = async (
    taskId: string,
    userId: string | null,
  ): Promise<Task> => {
    return this.taskRepository.getTaskDetails(taskId, userId);
  };

  getActiveUnscheduledTasksWithSpaceId = async (
    spaceId: string,
    userId: string | null,
  ): Promise<Task[]> => {
    await this.taskRepository.deactivateCompletedOnceTasks(userId);
    return this.taskRepository.getActiveUnscheduledTasksWithSpaceId(
      spaceId,
      userId,
    );
  };

  getActiveOnceTasksWithSpaceId = async (
    spaceId: string,
    userId: string | null,
  ): Promise<Task[]> => {
    await this.taskRepository.deactivateCompletedOnceTasks(userId);
    return this.taskRepository.getActiveOnceTasksWithSpaceId(spaceId, userId);
  };

  reorderTask = async (
    taskId: string,
    newSortOrder: number,
    newTimeOfDay: TimeOfDay | null,
    newCompletionStatus: TaskCompletionStatusEnum | undefined,
    userId: string | null,
  ): Promise<void> => {
    const isPremium = !!userId;

    await prisma.$transaction(async (tx) => {
      const currentTask = await this.taskRepository.getTaskById(taskId, userId);
      if (!currentTask) throw new Error('Task not found');

      const updatedTask = await this.taskRepository.updateTaskSortOrder(
        taskId,
        newSortOrder,
        newTimeOfDay,
        newCompletionStatus,
        userId,
        tx,
      );

      if (isPremium) {
        await this.pendingOpRepository.enqueueOperation(
          {
            userId: userId!,
            operationType: 'update',
            entityType: 'task',
            entityId: updatedTask.id,
            payload: JSON.stringify({ ...updatedTask, tags: [] }),
          },
          tx,
        );
      }

      if (currentTask.repetitiveTaskTemplateId) {
        try {
          const template =
            await this.repetitiveTaskTemplateRepository.getRepetitiveTaskTemplateDetails(
              currentTask.repetitiveTaskTemplateId,
              userId,
            );

          if (
            template &&
            newTimeOfDay === template.timeOfDay &&
            newCompletionStatus !== TaskCompletionStatusEnum.FAILED
          ) {
            const updatedTemplate =
              await this.repetitiveTaskTemplateRepository.updateSortOrder(
                template.id,
                newSortOrder,
                userId,
                tx,
              );

            if (isPremium) {
              await this.pendingOpRepository.enqueueOperation(
                {
                  userId: userId!,
                  operationType: 'update',
                  entityType: 'repetitive_task_template',
                  entityId: updatedTemplate.id,
                  payload: JSON.stringify({ ...updatedTemplate, tags: [] }),
                },
                tx,
              );
            }
          }
        } catch (error) {
          log.warn(
            `[TaskService] Failed to update template sort order for task ${taskId}:`,
            error,
          );
        }
      }
    });

    if (isPremium) {
      syncService.runSync(userId);
    }
  };

  reindexTasks = async (
    updates: { id: string; sortOrder: number }[],
    userId: string | null,
  ): Promise<void> => {
    const isPremium = !!userId;

    await prisma.$transaction(async (tx) => {
      await this.taskRepository.bulkUpdateTaskSortOrder(updates, userId, tx);

      for (const update of updates) {
        const task = await this.taskRepository.getTaskById(update.id, userId);
        if (!task) continue;

        if (isPremium) {
          const payloadTask = { ...task, sortOrder: update.sortOrder };
          await this.pendingOpRepository.enqueueOperation(
            {
              userId: userId!,
              operationType: 'update',
              entityType: 'task',
              entityId: task.id,
              payload: JSON.stringify({ ...payloadTask, tags: [] }),
            },
            tx,
          );
        }

        if (task.repetitiveTaskTemplateId) {
          try {
            const template =
              await this.repetitiveTaskTemplateRepository.getRepetitiveTaskTemplateDetails(
                task.repetitiveTaskTemplateId,
                userId,
              );

            if (template && task.timeOfDay === template.timeOfDay) {
              const updatedTemplate =
                await this.repetitiveTaskTemplateRepository.updateSortOrder(
                  template.id,
                  update.sortOrder,
                  userId,
                  tx,
                );

              if (isPremium) {
                await this.pendingOpRepository.enqueueOperation(
                  {
                    userId: userId!,
                    operationType: 'update',
                    entityType: 'repetitive_task_template',
                    entityId: updatedTemplate.id,
                    payload: JSON.stringify({ ...updatedTemplate, tags: [] }),
                  },
                  tx,
                );
              }
            }
          } catch (error) {
            log.warn(
              `[TaskService] Failed to update template sort order during reindex for task ${task.id}:`,
              error,
            );
          }
        }
      }
    });

    if (isPremium) {
      syncService.runSync(userId);
    }
  };
}
