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
