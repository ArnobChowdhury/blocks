import {
  IAllTask,
  IFlattenedAllTask,
  TaskScheduleTypeEnum,
  TaskCompletionStatusEnum,
} from '../renderer/types';

interface ITodayTaskFromDB {
  task: {
    title: string;
    shouldBeScored: boolean | null;
    schedule: string;
  };
  id: number;
  dueDate: Date;
  completionStatus: string;
  score: number | null;
}

interface IFlattenedTask extends Omit<ITodayTaskFromDB, 'task'> {
  title: string;
  shouldBeScored: boolean | null;
}

// eslint-disable-next-line import/prefer-default-export
export const flattenTasksForToday = (tasks: ITodayTaskFromDB[]) => {
  const flattenedTasksForToday: IFlattenedTask[] = [];

  tasks.forEach((taskToday) => {
    const {
      task: { title, shouldBeScored, schedule },
      ...rest
    } = taskToday;
    const newTask = { ...rest, title, shouldBeScored, schedule };
    flattenedTasksForToday.push(newTask);
  });

  return flattenedTasksForToday;
};

export const flattenAllTasks = (tasks: IAllTask[]) => {
  const flattenedTasks: IFlattenedAllTask[] = [];

  tasks.forEach((task) => {
    const { DailyTaskEntry, ...rest } = task;
    let dueDate = null;
    let completionStatus = TaskCompletionStatusEnum.INCOMPLETE;
    if (task.schedule === TaskScheduleTypeEnum.Once) {
      const {
        dueDate: dueDateFromDB,
        completionStatus: completionStatusFromDb,
      } = DailyTaskEntry[0];
      dueDate = dueDateFromDB;
      completionStatus = completionStatusFromDb as TaskCompletionStatusEnum;
    }

    const newTask = { ...rest, dueDate, completionStatus };
    flattenedTasks.push(newTask);
  });

  return flattenedTasks;
};

export const getTodayStart = () => {
  const dateToday = new Date();
  const todayStart = new Date(dateToday.setHours(0, 0, 0, 0)).toISOString();
  return todayStart;
};

export const getTodayEnd = () => {
  const dateToday = new Date();
  const todayEnd = new Date(dateToday.setHours(23, 59, 59, 999)).toISOString();

  return todayEnd;
};
