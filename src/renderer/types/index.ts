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
  description: string;
  schedule: TaskScheduleTypeEnum;
  days?: DaysInAWeek[]; // only if the schedule is SpecificDaysInAWeek
  dueDate?: string; // only if the schedule is Once
  shouldBeScored?: boolean; // only if the schedule is Daily or SpecificDaysInAWeek
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

export enum ChannelsEnum {
  IPC_EXAMPLE = 'ipc-example',

  REQUEST_CREATE_TASK = 'request_create-task',
  RESPONSE_CREATE_TASK = 'response_create-task',

  REQUEST_TASKS_TODAY = 'request-tasks-today',
  RESPONSE_TASKS_TODAY = 'response-tasks-today',

  REQUEST_TOGGLE_TASK_COMPLETION_STATUS = 'request-toggle-task-completion-status',
  RESPONSE_TOGGLE_TASK_COMPLETION_STATUS = 'response-toggle-task-completion-status',
  ERROR_TOGGLE_TASK_COMPLETION_STATUS = 'error-toggle-task-completion-status',

  REQUEST_MONTHLY_REPORT = 'request-monthly-report',
  RESPONSE_MONTHLY_REPORT = 'response-monthly-report',
  ERROR_MONTHLY_REPORT = 'error-monthly-report',

  REQUEST_TASKS_OVERDUE = 'request-tasks-overdue',
  RESPONSE_TASKS_OVERDUE = 'response-tasks-overdue',

  REQUEST_TASK_FAILURE = 'request-task-failure',
  RESPONSE_TASK_FAILURE = 'response-task-failure',
  ERROR_TASK_FAILURE = 'error-task-failure',

  REQUEST_TASK_RESCHEDULE = 'request_task_reschedule',
  RESPONSE_TASK_RESCHEDULE = 'response_task_reschedule',
  ERROR_TASK_RESCHEDULE = 'error_task_reschedule',

  REQUEST_ALL_UNSCHEDULED_ACTIVE_TASKS = 'request_all_unscheduled_active_tasks',
  RESPONSE_ALL_UNSCHEDULED_ACTIVE_TASKS = 'response_all_unscheduled_active_tasks',
  ERROR_ALL_UNSCHEDULED_ACTIVE_TASKS = 'error_all_unscheduled_active_tasks',

  REQUEST_ALL_ONE_OFF_ACTIVE_TASKS = 'request_all_one_off_active_tasks',
  RESPONSE_ALL_ONE_OFF_ACTIVE_TASKS = 'response_all_one_off_active_tasks',
  ERROR_ALL_ONE_OFF_ACTIVE_TASKS = 'error_all_one_off_active_tasks',

  REQUEST_ALL_DAILY_ACTIVE_TASKS = 'request_all_daily_active_tasks',
  RESPONSE_ALL_DAILY_ACTIVE_TASKS = 'response_all_daily_active_tasks',
  ERROR_ALL_DAILY_ACTIVE_TASKS = 'error_all_daily_active_tasks',

  REQUEST_ALL_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS = 'request_all_specific_days_in_a_week_active_tasks',
  RESPONSE_ALL_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS = 'response_all_specific_days_in_a_week_active_tasks',
  ERROR_ALL_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS = 'error_all_specific_days_in_a_week_active_tasks',

  REQUEST_BULK_TASK_FAILURE = 'request_bulk_task_failure',
}

export enum IPCEventsResponseEnum {
  SUCCESSFUL = 'SUCCESSFUL',
  ERROR = 'ERROR',
}

export interface IEventResponse {
  message: IPCEventsResponseEnum;
}
