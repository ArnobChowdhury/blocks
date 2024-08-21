import { DaysInAWeek } from '../renderer/types';

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

export const getDaysForSpecificDaysInAWeekTasks = (days: DaysInAWeek[]) => {
  const week: { [key in DaysInAWeek]: boolean | null } = {
    [DaysInAWeek.Monday]: null,
    [DaysInAWeek.Tuesday]: null,
    [DaysInAWeek.Wednesday]: null,
    [DaysInAWeek.Thursday]: null,
    [DaysInAWeek.Friday]: null,
    [DaysInAWeek.Saturday]: null,
    [DaysInAWeek.Sunday]: null,
  };

  days.forEach((day) => {
    switch (day) {
      case 'monday':
        week.monday = true;
        break;
      case 'tuesday':
        week.tuesday = true;
        break;
      case 'wednesday':
        week.wednesday = true;
        break;
      case 'thursday':
        week.thursday = true;
        break;
      case 'friday':
        week.friday = true;
        break;
      case 'saturday':
        week.saturday = true;
        break;
      case 'sunday':
        week.sunday = true;
        break;
      default:
        break;
    }
  });

  return week;
};

export const getDaysForDailyTasks = () => {
  const week: { [key in DaysInAWeek]: boolean | undefined } = {
    [DaysInAWeek.Monday]: true,
    [DaysInAWeek.Tuesday]: true,
    [DaysInAWeek.Wednesday]: true,
    [DaysInAWeek.Thursday]: true,
    [DaysInAWeek.Friday]: true,
    [DaysInAWeek.Saturday]: true,
    [DaysInAWeek.Sunday]: true,
  };

  return week;
};
