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
import {
  RepetitiveTaskTemplate,
  Task,
  PrismaClient,
} from '../../generated/client';
import {
  ITaskIPC,
  TaskScheduleTypeEnum,
  TimeOfDay,
} from '../../renderer/types';
import { TaskRepository } from '../repositories/TaskRepository';
import { PendingOperationRepository } from '../repositories/PendingOperationRepository';
import { RepetitiveTaskTemplateRepository } from '../repositories/RepetitiveTaskTemplateRepository';
import { prisma } from '../prisma';
import { syncService } from './SyncService';
import { TaskService } from './TaskService';
import dayjs from 'dayjs';
import log from 'electron-log';

type PrismaTransactionalClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class RepetitiveTaskTemplateService {
  private repetitiveTaskTemplateRepository: RepetitiveTaskTemplateRepository;

  private taskRepository: TaskRepository;

  private pendingOpRepository: PendingOperationRepository;

  private taskService: TaskService;

  constructor() {
    this.repetitiveTaskTemplateRepository =
      new RepetitiveTaskTemplateRepository();
    this.taskRepository = new TaskRepository();
    this.pendingOpRepository = new PendingOperationRepository();
    this.taskService = new TaskService();
  }

  createRepetitiveTaskTemplate = async (
    taskData: ITaskIPC,
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate> => {
    const isPremium = !!userId;

    const newTemplate = await prisma.$transaction(async (tx) => {
      const createdTemplate =
        await this.repetitiveTaskTemplateRepository.createRepetitiveTaskTemplate(
          taskData,
          userId,
          tx,
        );

      if (isPremium) {
        await this.pendingOpRepository.enqueueOperation(
          {
            userId: userId!,
            operationType: 'create',
            entityType: 'repetitive_task_template',
            entityId: createdTemplate.id,
            payload: JSON.stringify({ ...createdTemplate, tags: [] }),
          },
          tx,
        );
      }
      return createdTemplate;
    });

    if (isPremium) {
      syncService.runSync();
    }

    return newTemplate;
  };

  updateRepetitiveTaskTemplate = async (
    taskData: ITaskIPC,
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate> => {
    const { id } = taskData;
    if (!id) {
      throw new Error(
        'Repetitive Task Template ID is required for an update operation.',
      );
    }

    const isPremium = !!userId;

    const updatedTemplate = await prisma.$transaction(async (tx) => {
      const template =
        await this.repetitiveTaskTemplateRepository.updateRepetitiveTaskTemplate(
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
            entityType: 'repetitive_task_template',
            entityId: template.id,
            payload: JSON.stringify({ ...template, tags: [] }),
          },
          tx,
        );
      }
      return template;
    });

    if (isPremium) {
      syncService.runSync();
    }

    return updatedTemplate;
  };

  getAllActiveDailyTemplates = async (
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate[]> => {
    await this.taskRepository.deactivateCompletedOnceTasks(userId);
    return this.repetitiveTaskTemplateRepository.getAllActiveDailyTemplates(
      userId,
    );
  };

  getAllActiveSpecificDaysInAWeekTemplates = async (
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate[]> => {
    await this.taskRepository.deactivateCompletedOnceTasks(userId);
    return this.repetitiveTaskTemplateRepository.getAllActiveSpecificDaysInAWeekTemplates(
      userId,
    );
  };

  getDailyTasksMonthlyReport = async (
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate[]> => {
    return this.repetitiveTaskTemplateRepository.getDailyTasksMonthlyReport(
      userId,
    );
  };

  getSpecificDaysInAWeekTasksMonthlyReport = async (
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate[]> => {
    return this.repetitiveTaskTemplateRepository.getSpecificDaysInAWeekTasksMonthlyReport(
      userId,
    );
  };

  getRepetitiveTaskTemplateDetails = async (
    templateId: string,
    userId: string | null,
  ) => {
    return this.repetitiveTaskTemplateRepository.getRepetitiveTaskTemplateDetails(
      templateId,
      userId,
    );
  };

  stopRepetitiveTaskTemplate = async (
    templateId: string,
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate> => {
    const isPremium = !!userId;

    const stoppedTemplate = await prisma.$transaction(async (tx) => {
      const template =
        await this.repetitiveTaskTemplateRepository.stopRepetitiveTaskTemplate(
          templateId,
          userId,
          tx,
        );

      if (isPremium) {
        await this.pendingOpRepository.enqueueOperation(
          {
            userId: userId!,
            operationType: 'update',
            entityType: 'repetitive_task_template',
            entityId: template.id,
            payload: JSON.stringify({ ...template, tags: [] }),
          },
          tx,
        );
      }
      return template;
    });

    if (isPremium) {
      syncService.runSync();
    }

    return stoppedTemplate;
  };

  getActiveDailyTemplatesWithSpaceId = async (
    spaceId: string,
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate[]> => {
    return this.repetitiveTaskTemplateRepository.getActiveDailyTemplatesWithSpaceId(
      spaceId,
      userId,
    );
  };

  getActiveSpecificDaysInAWeekTemplatesWithSpaceId = async (
    spaceId: string,
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate[]> => {
    return this.repetitiveTaskTemplateRepository.getActiveSpecificDaysInAWeekTemplatesWithSpaceId(
      spaceId,
      userId,
    );
  };

  updateLastDateOfTaskGeneration = async (
    templateId: string,
    lastDate: Date,
    userId: string | null,
    tx: PrismaTransactionalClient,
  ): Promise<RepetitiveTaskTemplate> => {
    const updatedTemplate =
      await this.repetitiveTaskTemplateRepository.updateLastDateOfTaskGeneration(
        templateId,
        lastDate,
        tx,
      );

    const isPremium = !!userId;
    if (isPremium) {
      if (!updatedTemplate) {
        throw new Error(
          `[RepetitiveTaskTemplateService] Cannot update last generation date for non-existent template with ID ${templateId}`,
        );
      }

      await this.pendingOpRepository.enqueueOperation(
        {
          userId: userId!,
          operationType: 'update',
          entityType: 'repetitive_task_template',
          entityId: templateId,
          payload: JSON.stringify({ ...updatedTemplate, tags: [] }),
        },
        tx,
      );
    }
    return updatedTemplate;
  };

  generateDueTasks = async (userId: string | null): Promise<void> => {
    const dueTemplates =
      await this.repetitiveTaskTemplateRepository.getDueRepetitiveTemplates(
        userId,
      );

    if (dueTemplates.length === 0) {
      return;
    }

    const isPremium = !!userId;

    const processingPromises = dueTemplates.map((template) =>
      prisma.$transaction(async (tx) => {
        const todayStart = dayjs().startOf('day');
        let lastGenDate = template.lastDateOfTaskGeneration;

        if (!lastGenDate) {
          const templateCreationDate = dayjs(template.createdAt).startOf('day');
          if (templateCreationDate.isSame(todayStart)) {
            lastGenDate = todayStart.subtract(1, 'day').toDate();
          } else {
            lastGenDate = template.createdAt;
          }
        }

        const daysToGenerate = todayStart.diff(
          dayjs(lastGenDate).startOf('day'),
          'day',
        );

        let latestDueDateForTemplate: Date | undefined;

        const taskCreationPromises: Promise<Task | void>[] = [];

        for (let i = 0; i < daysToGenerate; i += 1) {
          const targetDueDate = dayjs(lastGenDate)
            .startOf('day')
            .add(i + 1, 'day');
          const dayOfWeekLowercase = targetDueDate
            .format('dddd')
            .toLowerCase() as keyof RepetitiveTaskTemplate;

          let shouldGenerateTask = false;
          if (template.schedule === TaskScheduleTypeEnum.Daily) {
            shouldGenerateTask = true;
          } else if (
            template.schedule === TaskScheduleTypeEnum.SpecificDaysInAWeek
          ) {
            shouldGenerateTask = !!template[dayOfWeekLowercase];
          }

          if (shouldGenerateTask) {
            const newTaskData: ITaskIPC = {
              title: template.title,
              description: template.description,
              schedule: template.schedule as TaskScheduleTypeEnum,
              dueDate: targetDueDate.toDate(),
              timeOfDay: template.timeOfDay as TimeOfDay | null,
              repetitiveTaskTemplateId: template.id,
              shouldBeScored: template.shouldBeScored,
              spaceId: template.spaceId,
            };

            taskCreationPromises.push(
              this.taskService._createTaskInternal(newTaskData, userId, tx),
            );

            latestDueDateForTemplate = targetDueDate.toDate();
          }
        }

        await Promise.all(taskCreationPromises);

        if (latestDueDateForTemplate) {
          await this.updateLastDateOfTaskGeneration(
            template.id,
            latestDueDateForTemplate,
            userId,
            tx,
          );
        }
      }),
    );

    const results = await Promise.allSettled(processingPromises);

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const failedTemplateId = dueTemplates[index].id;
        log.error(
          `[RepetitiveTaskTemplateService] Transaction failed for template ${failedTemplateId}.`,
          result.reason,
        );
      }
    });

    if (isPremium) {
      syncService.runSync();
    }
  };
}
