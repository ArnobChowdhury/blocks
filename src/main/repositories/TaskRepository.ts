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
import { Task } from '../../generated/client';
import { ITaskIPC } from '../../renderer/types';
import { prisma } from '../prisma';

export class TaskRepository {
  createTask = async (
    taskData: ITaskIPC,
    userId: string | null,
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

    return prisma.task.create({
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

    return prisma.task.update({
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
}
