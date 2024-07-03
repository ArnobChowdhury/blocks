interface ITaskFromDB {
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

interface IFlattenedTask extends Omit<ITaskFromDB, 'task'> {
  title: string;
  shouldBeScored: boolean | null;
}

// eslint-disable-next-line import/prefer-default-export
export const flattenTasksForToday = (tasks: ITaskFromDB[]) => {
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
