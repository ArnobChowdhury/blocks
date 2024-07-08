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

export interface IDailyTaskEntry {
  id: number;
  taskId: number;
  completionStatus: string;
  dueDate: Date;
  score: number | null;
  createdAt: Date;
  lastModifiedAt: Date;
}

export enum TaskCompletionStatusEnum {
  INCOMPLETE = 'INCOMPLETE',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

/**
 * Todos
 * 1. All tasks is now separated. So we need 2 interfaces.
 *    One for one-off or unscheduled tasks and one for repetitive tasks.
 */
export interface IAllTask {
  id: number;
  isActive: boolean;
  title: string;
  schedule: string;
  monday: boolean | null;
  tuesday: boolean | null;
  wednesday: boolean | null;
  thursday: boolean | null;
  friday: boolean | null;
  saturday: boolean | null;
  sunday: boolean | null;
  shouldBeScored: boolean | null;
  DailyTaskEntry: IDailyTaskEntry[];
  lastEntryUpdateDate: Date | null;
  createdAt: Date;
  lastModifiedAt: Date;
}

export interface IFlattenedAllTask extends Omit<IAllTask, 'DailyTaskEntry'> {
  dueDate: Date | null;
  completionStatus: TaskCompletionStatusEnum;
}

export enum ChannelsEnum {
  IPC_EXAMPLE = 'ipc-example',

  REQUEST_CREATE_TASK = 'request_create-task',
  RESPONSE_CREATE_TASK = 'response_create-task',
  ERROR_CREATE_TASK = 'error_create-task',

  REQUEST_TASKS_TODAY = 'request-tasks-today',
  RESPONSE_TASKS_TODAY = 'response-tasks-today',

  REQUEST_TOGGLE_TASK_COMPLETION_STATUS = 'request-toggle-task-completion-status',

  REQUEST_MONTHLY_REPORT = 'request-monthly-report',
  RESPONSE_MONTHLY_REPORT = 'response-monthly-report',

  REQUEST_TASKS_OVERDUE = 'request-tasks-overdue',
  RESPONSE_TASKS_OVERDUE = 'response-tasks-overdue',

  REQUEST_TASK_FAILURE = 'request-task-failure',

  REQUEST_TASK_RESCHEDULE = 'request_task_reschedule',

  REQUEST_ALL_ACTIVE_TASKS = 'request_all_active_tasks',
  RESPONSE_ALL_ACTIVE_TASKS = 'response_all_active_tasks',
}

export enum IPCEventsResponseEnum {
  SUCCESSFUL = 'SUCCESSFUL',
  ERROR = 'ERROR',
}
