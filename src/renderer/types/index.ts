import {
  Task,
  RepetitiveTaskTemplate,
  Tag,
  Space,
  // eslint-disable-next-line import/no-relative-packages
} from '../../generated/client';

export type TaskWithTags = Task & { tags: Tag[] };
export type RepetitiveTaskWithTags = RepetitiveTaskTemplate & { tags: Tag[] };
// We may merge the above 2 type with the below 2 types in the future if there are no cases where we get tags and not the spaces
export type TaskWithTagsAndSpace = Task & { tags: Tag[]; space: Space };
export type RepetitiveTaskWithTagsAndSpace = RepetitiveTaskTemplate & {
  tags: Tag[];
  space: Space;
};

export interface ExtendedRepetitiveTaskTemplate extends RepetitiveTaskTemplate {
  Task: Task[];
}
export type { Tag, Task, Space };

export enum DaysInAWeek {
  Sunday = 'sunday',
  Monday = 'monday',
  Tuesday = 'tuesday',
  Wednesday = 'wednesday',
  Thursday = 'thursday',
  Friday = 'friday',
  Saturday = 'saturday',
}

export enum TimeOfDay {
  Morning = 'morning',
  Afternoon = 'afternoon',
  Evening = 'evening',
  Night = 'night',
}

export enum TaskScheduleTypeEnum {
  Unscheduled = 'Unscheduled',
  Once = 'Once',
  Daily = 'Daily',
  SpecificDaysInAWeek = 'Specific Days in a Week',
}

export enum TaskCompletionStatusEnum {
  INCOMPLETE = 'INCOMPLETE',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

export interface ITaskIPC {
  id?: number;
  title: string;
  description: string;
  schedule: TaskScheduleTypeEnum;
  days?: DaysInAWeek[]; // only if the schedule is SpecificDaysInAWeek
  dueDate?: string; // only if the schedule is Once
  shouldBeScored?: boolean; // only if the schedule is Daily or SpecificDaysInAWeek
  timeOfDay?: TimeOfDay;
  completionStatus?: TaskCompletionStatusEnum;
  tagIds: { id: number }[];
  spaceId?: number;
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

  RESPONSE_CREATE_OR_UPDATE_TASK = 'response_create-task',

  REQUEST_UPDATE_TASK = 'request_task_update',
  REQUEST_UPDATE_REPETITIVE_TASK = 'request_update_repetitive_task',

  REQUEST_TASKS_TODAY = 'request-tasks-today',
  RESPONSE_TASKS_TODAY = 'response-tasks-today',

  REQUEST_TOGGLE_TASK_COMPLETION_STATUS = 'request-toggle-task-completion-status',

  REQUEST_DAILY_TASKS_MONTHLY_REPORT = 'request_daily_tasks_monthly_report',
  REQUEST_SPECIFIC_DAYS_IN_A_WEEK_DAILY_TASKS_MONTHLY_REPORT = 'request_specific_days_in_a_week_daily_tasks_monthly_report',

  REQUEST_TASKS_OVERDUE = 'request-tasks-overdue',
  RESPONSE_TASKS_OVERDUE = 'response-tasks-overdue',

  REQUEST_TASK_FAILURE = 'request-task-failure',

  REQUEST_TASK_RESCHEDULE = 'request_task_reschedule',

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

  REQUEST_TASK_DETAILS = 'request_task_details',

  REQUEST_REPETITIVE_TASK_DETAILS = 'request_repetitive_task_details',

  REQUEST_STOP_REPETITIVE_TASK = 'request_stop_repetitive_task',

  REQUEST_ALL_TAGS = 'request_all_tags',

  REQUEST_ALL_SPACES = 'request_all_spaces',

  REQUEST_CREATE_TAG = 'request_create_tag',

  REQUEST_CREATE_SPACE = 'request_create_space',

  RESPONSE_CREATE_OR_UPDATE_TAG = 'response_create_or_update_tag',

  REQUEST_UNSCHEDULED_ACTIVE_TASKS_WITH_SPACE_ID = 'request_unscheduled_active_tasks_with_space_id',
  RESPONSE_UNSCHEDULED_ACTIVE_TASKS_WITH_SPACE_ID = 'response_unscheduled_active_tasks_with_space_id',
  ERROR_UNSCHEDULED_ACTIVE_TASKS_WITH_SPACE_ID = 'error_unscheduled_active_tasks_with_space_id',

  REQUEST_ONE_OFF_ACTIVE_TASKS_WITH_SPACE_ID = 'request_one_off_active_tasks_with_space_id',
  RESPONSE_ONE_OFF_ACTIVE_TASKS_WITH_SPACE_ID = 'response_one_off_active_tasks_with_space_id',
  ERROR_ONE_OFF_ACTIVE_TASKS_WITH_SPACE_ID = 'error_one_off_active_tasks_with_space_id',

  REQUEST_DAILY_ACTIVE_TASKS_WITH_SPACE_ID = 'request_daily_active_tasks_with_space_id',
  RESPONSE_DAILY_ACTIVE_TASKS_WITH_SPACE_ID = 'response_daily_active_tasks_with_space_id',
  ERROR_DAILY_ACTIVE_TASKS_WITH_SPACE_ID = 'error_daily_active_tasks_with_space_id',

  REQUEST_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS_WITH_SPACE_ID = 'request_specific_days_in_a_week_active_tasks_with_space_id',
  RESPONSE_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS_WITH_SPACE_ID = 'response_specific_days_in_a_week_active_tasks_with_space_id',
  ERROR_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS_WITH_SPACE_ID = 'error_specific_days_in_a_week_active_tasks_with_space_id',
}
