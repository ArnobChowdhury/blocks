import { useState } from 'react';
import { styled, useTheme } from '@mui/material';
import dayjs from 'dayjs';
import {
  TaskScheduleTypeEnum,
  TaskCompletionStatusEnum,
  Task,
  ExtendedRepetitiveTaskTemplate,
} from '../types';
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

interface HabitTrackerProps {
  habits: ExtendedRepetitiveTaskTemplate[];
  header: string;
}

function HabitTracker({ habits, header }: HabitTrackerProps) {
  const [hoveredHabit, setHoveredHabit] =
    useState<ExtendedRepetitiveTaskTemplate | null>(null);

  const theme = useTheme();

  const timestamps: number[] = [];

  // Loop through the last 30 days in reverse order
  for (let i = 29; i > 0; i -= 1) {
    // Calculate the start of the day for each day
    const startOfDay = dayjs().subtract(i, 'day').startOf('day').valueOf();
    timestamps.push(startOfDay);
  }

  // Add today as the last entry
  timestamps.push(dayjs().startOf('day').valueOf());

  const months: [string, number][] = [];
  timestamps.forEach((timestamp, index) => {
    const monthName = dayjs(timestamp).format('MMMM');
    if (index === 0) {
      months.push([monthName, 30]);
    } else if (dayjs(timestamp).format('D') === '1') {
      if (months.length > 0) {
        months[months.length - 1][1] = index;
      }
      months.push([monthName, 30 - index]);
    }
  });

  /**
   * Todos
   * 1. make a useHabit hook?
   * 2. Logic needs to be checked and simplified - same logic written for DAILY and WEEKLY tasks
   * 3. Mapped values need to have key props (check console log)
   * 4. Syntactic error in using table elements - (check console errors)
   * 5. Can the graph building algorithm's time complexity be improved?
   * 6. Handle error
   */

  return (
    <table
      style={{ borderSpacing: '2px', marginTop: '30px', marginBottom: '4px' }}
    >
      <thead>
        <tr>
          <th colSpan={30}>{header}</th>
        </tr>
        <tr>
          {months.map(([month, days]) => {
            return (
              <th
                colSpan={days}
                key={month}
                style={{
                  textAlign: 'left',
                  fontSize: days < 2 ? '9px' : '12px',
                  fontWeight: 'bold',
                  paddingLeft: '4px',
                }}
              >
                {days < 4 ? month.slice(0, 3) : month}
              </th>
            );
          })}
        </tr>
        <tr>
          {timestamps.map((timestamp) => {
            return (
              <StyledTh key={timestamp}>
                {new Date(timestamp).getDate()}
              </StyledTh>
            );
          })}
          <StyledTh sx={{ textAlign: 'left', fontWeight: 'bold' }}>
            Habits
          </StyledTh>
        </tr>
      </thead>
      <tbody>
        {habits?.map((habit) => {
          const entriesByDate: { [key: number]: Task } = {};

          // todo  can its time complexity be improved?
          habit?.Task.forEach((taskEntry) => {
            const { dueDate } = taskEntry;
            if (dueDate) {
              const dateOfTask = dayjs(dueDate).startOf('day').valueOf();
              entriesByDate[dateOfTask] = taskEntry;
            }
          });

          return (
            <tr
              onMouseEnter={() => setHoveredHabit(habit)}
              onMouseLeave={() => setHoveredHabit(null)}
              key={`${habit.title}-${habit.id}`}
            >
              {timestamps.map((timestamp) => {
                const entry = entriesByDate[timestamp];
                if (!entry) {
                  return <StyledTd key={`${timestamp}-${habit.id}-no-entry`} />;
                }
                const key = `${timestamp}-${entry.id}`;

                // daily task logic
                if (habit?.schedule === TaskScheduleTypeEnum.Daily) {
                  if (
                    entry.completionStatus === TaskCompletionStatusEnum.COMPLETE
                  ) {
                    if (entry.score !== null) {
                      const bg = scoreColors[entry.score];
                      return (
                        <StyledTd sx={{ backgroundColor: bg }} key={key} />
                      );
                    }
                    return (
                      <StyledTd
                        sx={{ backgroundColor: scoreColors[4] }}
                        key={key}
                      />
                    );
                  }
                  if (
                    entry.completionStatus === TaskCompletionStatusEnum.FAILED
                  ) {
                    return (
                      <StyledTd sx={{ backgroundColor: '#d43f3f' }} key={key} />
                    );
                  }
                } else {
                  // logic for specific tasks in a week
                  if (
                    entry.completionStatus === TaskCompletionStatusEnum.COMPLETE
                  ) {
                    return (
                      <StyledTd
                        sx={{ backgroundColor: scoreColors[4] }}
                        key={key}
                      />
                    );
                  }
                  if (
                    entry.completionStatus === TaskCompletionStatusEnum.FAILED
                  ) {
                    return (
                      <StyledTd sx={{ backgroundColor: '#d43f3f' }} key={key} />
                    );
                  }
                  return <StyledTd key={key} />;
                }
                return <StyledTd key={key} />;
              })}

              <StyledTd
                style={{
                  minWidth: '150px',
                  fontSize: '13px',
                  backgroundColor: 'white',
                  border: '1px solid transparent',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color:
                    hoveredHabit?.id === habit?.id
                      ? theme.palette.primary.main
                      : 'inherit',
                  fontWeight: hoveredHabit?.id === habit?.id ? 'bold' : 400,
                  transition: 'all ease-in 0.1s',
                }}
              >
                {habit?.title}
              </StyledTd>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default HabitTracker;
