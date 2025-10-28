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
import { RepetitiveTaskTemplate } from '../../generated/client';
import { ITaskIPC } from '../../renderer/types';
import { TaskRepository } from '../repositories/TaskRepository';
import { PendingOperationRepository } from '../repositories/PendingOperationRepository';
import { RepetitiveTaskTemplateRepository } from '../repositories/RepetitiveTaskTemplateRepository';
import { prisma } from '../prisma';
import { syncService } from './SyncService';

export class RepetitiveTaskTemplateService {
  private repetitiveTaskTemplateRepository: RepetitiveTaskTemplateRepository;

  private taskRepository: TaskRepository;

  private pendingOpRepository: PendingOperationRepository;

  constructor() {
    this.repetitiveTaskTemplateRepository =
      new RepetitiveTaskTemplateRepository();
    this.taskRepository = new TaskRepository();
    this.pendingOpRepository = new PendingOperationRepository();
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

  getActiveDailyTemplatesWithoutSpace = async (
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate[]> => {
    return this.repetitiveTaskTemplateRepository.getActiveDailyTemplatesWithoutSpace(
      userId,
    );
  };

  getActiveSpecificDaysInAWeekTemplatesWithoutSpace = async (
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate[]> => {
    return this.repetitiveTaskTemplateRepository.getActiveSpecificDaysInAWeekTemplatesWithoutSpace(
      userId,
    );
  };

  generateDueTasks = async (userId: string | null): Promise<void> => {
    return this.repetitiveTaskTemplateRepository.generateDueTasksFromTemplates(
      userId,
    );
  };
}
