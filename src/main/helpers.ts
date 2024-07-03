interface ITaskFromDB {
  task: {
    title: string;
    shouldBeScored: boolean | null;
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
      task: { title, shouldBeScored },
      ...rest
    } = taskToday;
    const newTask = { ...rest, title, shouldBeScored };
    flattenedTasksForToday.push(newTask);
  });

  return flattenedTasksForToday;
};
