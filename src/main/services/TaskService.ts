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
import {
  ITaskIPC,
  TaskCompletionStatusEnum,
  TaskScheduleTypeEnum,
} from '../../renderer/types';
import { TaskRepository } from '../repositories/TaskRepository';

export class TaskService {
  private taskRepository: TaskRepository;

  constructor() {
    this.taskRepository = new TaskRepository();
  }

  createTask = async (
    taskData: ITaskIPC,
    userId: string | null,
  ): Promise<Task> => {
    return this.taskRepository.createTask(taskData, userId);
  };

  updateTask = async (
    taskData: ITaskIPC,
    userId: string | null,
  ): Promise<Task> => {
    const { id } = taskData;
    if (!id) {
      throw new Error('Task ID is required for an update operation.');
    }
    return this.taskRepository.updateTask(id, taskData, userId);
  };

  getTasksForToday = async (userId: string | null): Promise<Task[]> => {
    return this.taskRepository.getTasksForToday(userId);
  };

  getOverdueTasks = async (userId: string | null): Promise<Task[]> => {
    return this.taskRepository.getOverdueTasks(userId);
  };

  toggleTaskCompletionStatus = async (
    id: string,
    checked: boolean,
    score: number | null | undefined,
    userId: string | null,
  ): Promise<Task> => {
    const status = checked
      ? TaskCompletionStatusEnum.COMPLETE
      : TaskCompletionStatusEnum.INCOMPLETE;

    return this.taskRepository.updateTaskCompletionStatus(
      id,
      status,
      score,
      userId,
    );
  };

  failTask = async (taskId: string, userId: string | null): Promise<Task> => {
    return this.taskRepository.failTask(taskId, userId);
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

    let newSchedule: TaskScheduleTypeEnum | undefined;
    if (task.schedule === TaskScheduleTypeEnum.Unscheduled) {
      newSchedule = TaskScheduleTypeEnum.Once;
    }

    return this.taskRepository.rescheduleTask(
      taskId,
      dueDate,
      newSchedule,
      userId,
    );
  };

  bulkFailTasks = async (
    taskIds: string[],
    userId: string | null,
  ): Promise<{ count: number }> => {
    if (!taskIds || taskIds.length === 0) {
      return { count: 0 };
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

  getActiveUnscheduledTasksWithoutSpace = async (
    userId: string | null,
  ): Promise<Task[]> => {
    await this.taskRepository.deactivateCompletedOnceTasks(userId);
    return this.taskRepository.getActiveUnscheduledTasksWithoutSpace(userId);
  };

  getActiveOnceTasksWithoutSpace = async (
    userId: string | null,
  ): Promise<Task[]> => {
    await this.taskRepository.deactivateCompletedOnceTasks(userId);
    return this.taskRepository.getActiveOnceTasksWithoutSpace(userId);
  };
}
