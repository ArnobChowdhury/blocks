export enum DaysInAWeek {
  Sunday = 'sunday',
  Monday = 'monday',
  Tuesday = 'tuesday',
  Wednesday = 'wednesday',
  Thursday = 'thursday',
  Friday = 'friday',
  Saturday = 'saturday',
}

export enum TaskScheduleTypeEnum {
  Unscheduled = 'Unscheduled',
  Once = 'Once',
  Daily = 'Daily',
  SpecificDaysInAWeek = 'Specific Days in a Week',
}

export interface ITaskIPC {
  id?: string;
  title: string;
  schedule: TaskScheduleTypeEnum;
  days?: DaysInAWeek[]; // only if the schedule is SpecificDaysInAWeek
  dueDate?: string; // only if the schedule is Once
  shouldBeScored?: boolean; // only if the schedule is Daily or SpecificDaysInAWeek
}

export interface ITask {
  id: number;
  title: string;
  dueDate: string; // only if the schedule is Once
  completionStatus: 'INCOMPLETE' | 'COMPLETE' | 'POSTPONED';
  score?: number;
  shouldBeScored?: boolean;
  schedule: TaskScheduleTypeEnum;
}

export enum TaskCompletionStatusEnum {
  INCOMPLETE = 'INCOMPLETE',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

export enum ChannelsEnum {
  IPC_EXAMPLE = 'ipc-example',
  CREATE_TASK = 'create-task',
  REQUEST_TASKS_TODAY = 'request-tasks-today',
  RESPONSE_TASKS_TODAY = 'response-tasks-today',
  REQUEST_TOGGLE_TASK_COMPLETION_STATUS = 'request-toggle-task-completion-status',
  REQUEST_MONTHLY_REPORT = 'request-monthly-report',
  RESPONSE_MONTHLY_REPORT = 'response-monthly-report',
  REQUEST_TASKS_OVERDUE = 'request-tasks-overdue',
  RESPONSE_TASKS_OVERDUE = 'response-tasks-overdue',
  REQUEST_TASK_FAILURE = 'request-task-failure',
}
