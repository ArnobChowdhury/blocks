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
import {
  getDaysForDailyTasks,
  getDaysForSpecificDaysInAWeekTasks,
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
}
