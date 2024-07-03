import { useEffect, useState, useMemo } from 'react';
import { Typography, styled, Box } from '@mui/material';
import dayjs from 'dayjs';
import { TaskScheduleTypeEnum, TaskCompletionStatusEnum } from '../types';
import { scoreColors } from '../constants';

const StyledTh = styled('th')({
  height: '20px',
  minWidth: '22px',
  lineHeight: '20px',
  textAlign: 'center', // Optional: to center the text horizontally
  verticalAlign: 'middle', // Optional: to center the text vertically
  border: '1px solid transparent', // Optional: add border for better visualization
  fontSize: '12px',
  fontWeight: 400,
  padding: 0,
  borderRadius: '4px',
});

const StyledTd = styled('td')({
  height: '22px',
  minWidth: '20px',
  lineHeight: '12px',
  textAlign: 'center', // Optional: to center the text horizontally
  verticalAlign: 'middle', // Optional: to center the text vertically
  padding: 0,
  borderRadius: '4px',
  backgroundColor: '#EEE',
});

function HabitTracker() {
  const [habits, setHabits] = useState<unknown[]>();

  useEffect(() => {
    const monthIndex = dayjs().month();
    window.electron.ipcRenderer.sendMessage('request-monthly-report', {
      monthIndex,
    });
    window.electron.ipcRenderer.on('response-monthly-report', (response) => {
      setHabits(response as unknown[]);
    });
  }, []);

  const daysInCurrentMonth = useMemo(() => {
    return dayjs().daysInMonth();
  }, []);

  const dates = [...Array(daysInCurrentMonth).keys()].map((day) => day + 1);
  const dateToday = new Date().getDay();

  return (
    <>
      <Box display="flex" mt={3} mb={1} justifyContent="center">
        <Typography variant="h6">{dayjs().format('MMMM')}</Typography>
      </Box>
      <table style={{ borderSpacing: '4px' }}>
        <tr>
          {dates.map((date) => {
            return (
              <StyledTh
                sx={{
                  color: date === dateToday ? 'red' : 'inherit',
                  fontWeight: date === dateToday ? 'bold' : 400,
                }}
              >
                {date}
              </StyledTh>
            );
          })}
          <StyledTh sx={{ textAlign: 'left', fontWeight: 'bold' }}>
            Habits
          </StyledTh>
        </tr>
        {habits?.map((habit) => {
          const entriesByDate = {};

          habit?.DailyTaskEntry.forEach((taskEntry) => {
            const day = taskEntry.dueDate.getDay();
            entriesByDate[day] = taskEntry;
          });

          return (
            <tr>
              {dates.map((date) => {
                const entry = entriesByDate[date];
                if (!entry) {
                  return <StyledTd />;
                }

                // daily task logic
                if (habit?.schedule === TaskScheduleTypeEnum.Daily) {
                  if (
                    entry.completionStatus === TaskCompletionStatusEnum.COMPLETE
                  ) {
                    if (entry.score !== null) {
                      const bg = scoreColors[entry.score];
                      return <StyledTd sx={{ backgroundColor: bg }} />;
                    }
                    return <StyledTd sx={{ backgroundColor: '#B6D7A8' }} />;
                  }
                  if (
                    entry.completionStatus ===
                      TaskCompletionStatusEnum.INCOMPLETE &&
                    dateToday > date
                  ) {
                    return <StyledTd sx={{ backgroundColor: '#FFDADA' }} />;
                  }
                }

                // logic for specific tasks in a week
                if (
                  entry.completionStatus === TaskCompletionStatusEnum.COMPLETE
                ) {
                  return <StyledTd sx={{ backgroundColor: '#B6D7A8' }} />;
                }
                if (
                  entry.completionStatus ===
                    TaskCompletionStatusEnum.INCOMPLETE &&
                  dateToday > date
                ) {
                  return <StyledTd sx={{ backgroundColor: '#FFDADA' }} />;
                }
                return <StyledTd />;
              })}

              <StyledTd
                style={{
                  minWidth: '150px',
                  fontSize: '12px',
                  backgroundColor: 'white',
                  border: '1px solid transparent',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {habit?.title}
              </StyledTd>
            </tr>
          );
        })}
      </table>
    </>
  );
}

export default HabitTracker;
