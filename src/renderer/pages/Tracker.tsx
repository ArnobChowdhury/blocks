import { useEffect, useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { Box, Typography } from '@mui/material';
import NothingToTrack from '../images/NothingToTrack';
import { HabitTracker } from '../widgets';
import { PageHeader } from '../components';
import { useApp } from '../context/AppProvider';
import { ChannelsEnum, ExtendedRepetitiveTaskTemplate } from '../types';

function Tracker() {
  const [habitsDaily, setHabitsDaily] = useState<
    ExtendedRepetitiveTaskTemplate[]
  >([]);
  const [habitsSpecificDaysInAWeek, setHabitsSpecificDaysInAWeek] = useState<
    ExtendedRepetitiveTaskTemplate[]
  >([]);

  const { setNotifier } = useApp();

  useEffect(() => {}, []);

  const monthIndex = useMemo(() => {
    return dayjs().month();
  }, []);

  useEffect(() => {
    window.electron.ipcRenderer
      .invoke(ChannelsEnum.REQUEST_DAILY_TASKS_MONTHLY_REPORT, {
        monthIndex,
      })
      .then((dailyHabits) => {
        return setHabitsDaily(dailyHabits as ExtendedRepetitiveTaskTemplate[]);
      })
      .catch((err: any) => {
        // we do something here
        setNotifier(err.message, 'error');
      });
  }, [monthIndex, setNotifier]);

  useEffect(() => {
    window.electron.ipcRenderer
      .invoke(
        ChannelsEnum.REQUEST_SPECIFIC_DAYS_IN_A_WEEK_DAILY_TASKS_MONTHLY_REPORT,
        { monthIndex },
      )
      .then((specificDaysInAWeekHabits) => {
        return setHabitsSpecificDaysInAWeek(
          specificDaysInAWeekHabits as ExtendedRepetitiveTaskTemplate[],
        );
      })
      .catch((err) => {
        setNotifier(err.message, 'error');
      });
  }, [monthIndex, setNotifier]);

  const noDailyTask = habitsDaily.length === 0;
  const noSpecificDaysInAWeek = habitsSpecificDaysInAWeek.length === 0;
  const showImage = noDailyTask && noSpecificDaysInAWeek;

  return (
    <>
      <PageHeader>Habit Tracker</PageHeader>
      {!noDailyTask && <HabitTracker habits={habitsDaily} header="Daily" />}
      {!noSpecificDaysInAWeek && (
        <HabitTracker
          habits={habitsSpecificDaysInAWeek}
          header="Specific Days In a Week"
        />
      )}
      {showImage && (
        <Box
          width="100%"
          height="600px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          mt={2}
        >
          <Box>
            <Typography variant="body1" align="center">
              Add repetitive tasks to begin tracking!
            </Typography>
            <NothingToTrack />
          </Box>
        </Box>
      )}
    </>
  );
}

export default Tracker;
