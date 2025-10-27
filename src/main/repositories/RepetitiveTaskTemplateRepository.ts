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
  getTodayStart,
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

  /**
   * Generates new Task entries from RepetitiveTaskTemplate for past due dates up to today.
   * This method encapsulates the logic previously found in `generateDueRepetitiveTasks` in `main.ts`.
   * @param userId The ID of the user for whom to generate tasks.
   */
  generateDueTasksFromTemplates = async (
    userId: string | null,
  ): Promise<void> => {
    const todayStart = dayjs().startOf('day');
    const todayStartAsString = todayStart.toISOString();

    const dueRepetitiveTemplates = await prisma.repetitiveTaskTemplate.findMany(
      {
        where: {
          userId,
          isActive: true,
          OR: [
            { lastDateOfTaskGeneration: { lt: todayStartAsString } },
            { lastDateOfTaskGeneration: null },
          ],
        },
        include: {
          tags: true, // Included as per original logic, though not used in task creation
        },
      },
    );

    await Promise.all(
      dueRepetitiveTemplates.map(async (repetitiveTemplate) => {
        const {
          id: templateId,
          title,
          description,
          schedule,
          shouldBeScored,
          createdAt,
          timeOfDay,
          spaceId,
        } = repetitiveTemplate;

        let lastDateOfTaskGeneration: dayjs.Dayjs | Date | null;
        lastDateOfTaskGeneration = repetitiveTemplate.lastDateOfTaskGeneration;

        if (!lastDateOfTaskGeneration) {
          const taskCreationDate = dayjs(createdAt)
            .startOf('day')
            .toISOString();
          if (taskCreationDate === todayStart.toISOString()) {
            lastDateOfTaskGeneration = todayStart.subtract(1, 'day').toDate();
          } else {
            lastDateOfTaskGeneration = createdAt;
          }
        }

        const daysSinceLastTaskGeneration = dayjs()
          .startOf('day')
          .diff(dayjs(lastDateOfTaskGeneration).startOf('day'), 'day');

        const dayArray = Array.from(
          { length: daysSinceLastTaskGeneration },
          (_, i) => i + 1,
        );

        await Promise.all(
          dayArray.map(async (day) => {
            let dueDate: dayjs.Dayjs | string = dayjs(
              lastDateOfTaskGeneration,
            ).add(day, 'day');
            const dayOfWeekLowercase = dueDate.format('dddd').toLowerCase();

            // Check if the repetitive task is scheduled for this specific day of the week
            if (
              repetitiveTemplate[
                dayOfWeekLowercase as keyof RepetitiveTaskTemplate
              ]
            ) {
              dueDate = dueDate.toISOString();

              await prisma.task.upsert({
                where: {
                  repetitiveTaskTemplateId_dueDate: {
                    repetitiveTaskTemplateId: templateId,
                    dueDate,
                  },
                },
                create: {
                  repetitiveTaskTemplateId: templateId,
                  dueDate,
                  title,
                  description,
                  schedule,
                  shouldBeScored,
                  timeOfDay,
                  spaceId,
                  userId: repetitiveTemplate.userId,
                },
                update: {},
              });

              await prisma.repetitiveTaskTemplate.update({
                where: { id: templateId },
                data: { lastDateOfTaskGeneration: dueDate },
              });
            }
          }),
        );
      }),
    );
  };
}
