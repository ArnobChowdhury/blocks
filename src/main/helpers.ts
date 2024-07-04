import {
  IAllTask,
  IFlattenedAllTask,
  TaskScheduleTypeEnum,
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
    if (task.schedule === TaskScheduleTypeEnum.Once) {
      const { dueDate: dueDateFromDB } = DailyTaskEntry[0];
      dueDate = dueDateFromDB;
    }
    const newTask = { ...rest, dueDate };
    flattenedTasks.push(newTask);
  });

  return flattenedTasks;
};
