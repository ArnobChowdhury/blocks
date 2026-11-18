// eslint-disable-next-line import/prefer-default-export
export const scoreColors = [
  '#c0e8c2',
  '#7be187',
  '#24c241',
  '#019927',
  '#006620',
];

export const scoreColorConfigs = {
  failed: '#d43f3f',
  score1: '#c0e8c2',
  score2: '#7be187',
  score3: '#24c241',
  score4: '#019927',
  score5: '#006620',
  noActivity: '#eeeeee',
  padding: 'transparent',
};

export const SectionColors: { [key: string]: string } = {
  morning: '#E4F8FC',
  afternoon: '#FEEED4',
  evening: '#FFE5D9',
  night: '#CDD2E9',
  failed: '#FFDFDC',
  anytime: '#F5F5F5',
};

export const ROUTE_ROOT = '/';
export const ROUTE_ACTIVE = '/active';
export const ROUTE_HABITS = '/habits';
export const ROUTE_TRACKER = '/habits/:habitId/:habitName';
export const ROUTE_TASKS_WITHOUT_A_SPACE = '/space/defaults';
export const ROUTE_TASKS_WITH_A_SPACE = '/space/:spaceId/:spaceName';
export const ROUTE_AUTH = '/auth';
export const ROUTE_SETTINGS = '/settings';
export const ROUTE_OVERDUE = '/overdue';
