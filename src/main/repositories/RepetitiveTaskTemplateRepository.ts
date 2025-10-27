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
import dayjs from 'dayjs';
import { ITaskIPC, TaskScheduleTypeEnum } from '../../renderer/types';
import {
  getDaysForDailyTasks,
  getDaysForSpecificDaysInAWeekTasks,
  getTodayEnd,
} from '../helpers';
import { prisma } from '../prisma';

export class RepetitiveTaskTemplateRepository {
  createRepetitiveTaskTemplate = async (
    taskData: ITaskIPC,
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate> => {
    const {
      title,
      description,
      schedule,
      days,
      shouldBeScored,
      timeOfDay,
      spaceId,
    } = taskData;

    let dayBooleans: { [key: string]: boolean | undefined } = {};

    if (schedule === 'Daily') {
      dayBooleans = getDaysForDailyTasks();
    } else if (schedule === 'Specific Days in a Week' && days) {
      dayBooleans = getDaysForSpecificDaysInAWeekTasks(days);
    }

    return prisma.repetitiveTaskTemplate.create({
      data: {
        title,
        description,
        schedule,
        shouldBeScored,
        timeOfDay,
        spaceId,
        userId,
        ...dayBooleans,
      },
    });
  };

  updateRepetitiveTaskTemplate = async (
    templateId: string,
    taskData: ITaskIPC,
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate> => {
    const {
      title,
      description,
      schedule,
      days,
      shouldBeScored,
      timeOfDay,
      spaceId,
    } = taskData;

    let dayBooleans: { [key: string]: boolean | undefined } = {};

    if (schedule === 'Daily') {
      dayBooleans = getDaysForDailyTasks();
    } else if (schedule === 'Specific Days in a Week' && days) {
      dayBooleans = getDaysForSpecificDaysInAWeekTasks(days);
    }

    return prisma.repetitiveTaskTemplate.update({
      where: { id: templateId, userId },
      data: {
        title,
        description,
        shouldBeScored,
        timeOfDay,
        spaceId,
        ...dayBooleans,
      },
    });
  };

  getAllActiveDailyTemplates = async (
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate[]> => {
    return prisma.repetitiveTaskTemplate.findMany({
      where: {
        userId,
        isActive: true,
        schedule: TaskScheduleTypeEnum.Daily,
      },
    });
  };

  getAllActiveSpecificDaysInAWeekTemplates = async (
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate[]> => {
    return prisma.repetitiveTaskTemplate.findMany({
      where: {
        userId,
        isActive: true,
        schedule: TaskScheduleTypeEnum.SpecificDaysInAWeek,
      },
    });
  };

  getDailyTasksMonthlyReport = async (
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate[]> => {
    const startDate = dayjs().subtract(30, 'day').toDate();
    const endDate = getTodayEnd();

    return prisma.repetitiveTaskTemplate.findMany({
      where: {
        userId,
        schedule: TaskScheduleTypeEnum.Daily,
        tasks: {
          some: {
            dueDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      include: {
        tasks: {
          orderBy: {
            dueDate: 'asc',
          },
          where: {
            dueDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    });
  };

  getSpecificDaysInAWeekTasksMonthlyReport = async (
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate[]> => {
    const startDate = dayjs().subtract(30, 'day').toDate();
    const endDate = getTodayEnd();

    return prisma.repetitiveTaskTemplate.findMany({
      where: {
        userId,
        schedule: TaskScheduleTypeEnum.SpecificDaysInAWeek,
        tasks: {
          some: {
            dueDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      include: {
        tasks: {
          orderBy: {
            dueDate: 'asc',
          },
          where: {
            dueDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    });
  };

  getRepetitiveTaskTemplateDetails = async (
    templateId: string,
    userId: string | null,
  ) => {
    return prisma.repetitiveTaskTemplate.findUniqueOrThrow({
      where: {
        id: templateId,
        userId,
      },
      include: {
        tags: true,
        space: true,
      },
    });
  };

  stopRepetitiveTaskTemplate = async (
    templateId: string,
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate> => {
    return prisma.repetitiveTaskTemplate.update({
      where: {
        id: templateId,
        userId,
      },
      data: {
        isActive: false,
      },
    });
  };

  getActiveDailyTemplatesWithSpaceId = async (
    spaceId: string,
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate[]> => {
    return prisma.repetitiveTaskTemplate.findMany({
      where: {
        spaceId,
        userId,
        isActive: true,
        schedule: TaskScheduleTypeEnum.Daily,
      },
    });
  };

  getActiveSpecificDaysInAWeekTemplatesWithSpaceId = async (
    spaceId: string,
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate[]> => {
    return prisma.repetitiveTaskTemplate.findMany({
      where: {
        spaceId,
        userId,
        isActive: true,
        schedule: TaskScheduleTypeEnum.SpecificDaysInAWeek,
      },
    });
  };

  getActiveDailyTemplatesWithoutSpace = async (
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate[]> => {
    return prisma.repetitiveTaskTemplate.findMany({
      where: {
        spaceId: null,
        userId,
        isActive: true,
        schedule: TaskScheduleTypeEnum.Daily,
      },
    });
  };

  getActiveSpecificDaysInAWeekTemplatesWithoutSpace = async (
    userId: string | null,
  ): Promise<RepetitiveTaskTemplate[]> => {
    return prisma.repetitiveTaskTemplate.findMany({
      where: {
        spaceId: null,
        userId,
        isActive: true,
        schedule: TaskScheduleTypeEnum.SpecificDaysInAWeek,
      },
    });
  };
}
