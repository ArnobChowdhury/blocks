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
