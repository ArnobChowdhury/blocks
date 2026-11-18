import { useState, useMemo, useLayoutEffect, useRef } from 'react';
import { Box, useTheme } from '@mui/material';
import dayjs from 'dayjs';
import {
  Task,
  TaskScheduleTypeEnum,
  TaskCompletionStatusEnum,
  RepetitiveTaskTemplate,
  DaysInAWeek,
} from '../types';
import { scoreColorConfigs } from '../constants';

interface HabitHeatmapProps {
  repetitiveTaskTemplate?: RepetitiveTaskTemplate;
  tasks: Task[];
  endDate?: Date | string;
  squareSize?: number;
  numDays?: number;
  onDayPress?: (date: string, task: Task | undefined) => void;
  showMonthLabels?: boolean;
}

const DEFAULT_SQUARE_SIZE = 16;
const DEFAULT_SQUARE_MARGIN = 4;
const DAYS_IN_WEEK = 7;
const MONTH_LABEL_HEIGHT = 20;
const DAY_LABEL_WIDTH = 30;
const NUM_DAYS_TO_DISPLAY = 120;

const getColorForTask = (task: Task | undefined): string => {
  if (!task || task.completionStatus === TaskCompletionStatusEnum.INCOMPLETE) {
    return scoreColorConfigs.noActivity;
  }

  if (task.completionStatus === TaskCompletionStatusEnum.FAILED) {
    return scoreColorConfigs.failed;
  }

  if (
    task.completionStatus === TaskCompletionStatusEnum.COMPLETE &&
    !task.shouldBeScored
  ) {
    return scoreColorConfigs.score5;
  }

  if (task.completionStatus === TaskCompletionStatusEnum.COMPLETE) {
    const score = task.shouldBeScored ? ((task as any).score ?? 0) : 0;
    switch (score) {
      case 1:
        return scoreColorConfigs.score1;
      case 2:
        return scoreColorConfigs.score2;
      case 3:
        return scoreColorConfigs.score3;
      case 4:
        return scoreColorConfigs.score4;
      case 5:
        return scoreColorConfigs.score5;
      default:
        return scoreColorConfigs.noActivity;
    }
  }
  return scoreColorConfigs.noActivity;
};

const WEEK_DAY_CONFIG = [
  { label: 'Sun', key: DaysInAWeek.Sunday },
  { label: 'Mon', key: DaysInAWeek.Monday },
  { label: 'Tue', key: DaysInAWeek.Tuesday },
  { label: 'Wed', key: DaysInAWeek.Wednesday },
  { label: 'Thu', key: DaysInAWeek.Thursday },
  { label: 'Fri', key: DaysInAWeek.Friday },
  { label: 'Sat', key: DaysInAWeek.Saturday },
];

function HabitHeatmap({
  repetitiveTaskTemplate,
  tasks,
  endDate: propEndDate,
  squareSize = DEFAULT_SQUARE_SIZE,
  onDayPress,
  numDays = NUM_DAYS_TO_DISPLAY,
  showMonthLabels,
}: HabitHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewWidth, setViewWidth] = useState<number | null>(null);
  const [dynamicSquareSize, setDynamicSquareSize] =
    useState<number>(squareSize);

  const theme = useTheme();

  useLayoutEffect(() => {
    let observer: ResizeObserver | null = null;

    if (containerRef.current) {
      const updateWidth = () => {
        if (containerRef.current) {
          setViewWidth(containerRef.current.clientWidth);
        }
      };

      updateWidth();
      observer = new ResizeObserver(updateWidth);
      observer.observe(containerRef.current);
    }

    return () => {
      observer?.disconnect();
    };
  }, []);

  const taskMap = useMemo(() => {
    const map = new Map<string, Task>();
    tasks.forEach((task) => {
      try {
        if (task.dueDate) {
          const parsedDayjsDate = dayjs(task.dueDate);
          if (parsedDayjsDate.isValid()) {
            map.set(parsedDayjsDate.format('YYYY-MM-DD'), task);
          } else {
            console.warn(
              `[HabitHeatmap] Invalid task.dueDate date: ${task.dueDate}`,
            );
          }
        }
      } catch (e) {
        console.warn(
          `[HabitHeatmap] Error processing task date: ${task.dueDate}`,
          e,
        );
      }
    });

    return map;
  }, [tasks]);

  const djsEndDate = dayjs(propEndDate);
  const djsDisplayDataEndDate = djsEndDate;
  const djsDisplayDataStartDate = djsDisplayDataEndDate.subtract(
    numDays - 1,
    'day',
  );

  const calendarGridStartDate = djsDisplayDataStartDate.startOf('week');

  const endWeekForCalc = djsDisplayDataEndDate.startOf('week');
  const numWeeksToRender =
    endWeekForCalc.diff(calendarGridStartDate, 'week') + 1;

  const totalCellSize = dynamicSquareSize + DEFAULT_SQUARE_MARGIN;
  const dayLabelOffset = repetitiveTaskTemplate ? DAY_LABEL_WIDTH : 0;
  const monthLabelOffset = showMonthLabels ? MONTH_LABEL_HEIGHT : 0;

  const weeksGrid: dayjs.Dayjs[][] = [];
  for (let weekIdx = 0; weekIdx < numWeeksToRender; weekIdx += 1) {
    const firstDayOfThisGridWeek = calendarGridStartDate.add(
      weekIdx * DAYS_IN_WEEK,
      'day',
    );
    const weekDays: dayjs.Dayjs[] = [];
    for (let dayOfWeekIdx = 0; dayOfWeekIdx < DAYS_IN_WEEK; dayOfWeekIdx += 1) {
      weekDays.push(firstDayOfThisGridWeek.add(dayOfWeekIdx, 'day'));
    }
    weeksGrid.push(weekDays);
  }

  const monthLabels: { text: string; x: number }[] = [];
  if (showMonthLabels) {
    let lastMonthLabeled = -1;
    weeksGrid.forEach((week, weekIdx) => {
      let monthLabelDate: dayjs.Dayjs | null =
        week.find(
          (dayInWeek) =>
            dayInWeek.date() === 1 &&
            dayInWeek.month() !== lastMonthLabeled &&
            !dayInWeek.isBefore(djsDisplayDataStartDate, 'day') &&
            !dayInWeek.isAfter(djsDisplayDataEndDate, 'day'),
        ) || null;

      if (!monthLabelDate && weekIdx === 0) {
        const firstDayInGrid = week[0];
        if (
          !firstDayInGrid.isBefore(djsDisplayDataStartDate, 'day') &&
          !firstDayInGrid.isAfter(djsDisplayDataEndDate, 'day')
        ) {
          monthLabelDate = firstDayInGrid;
        }
      }

      if (monthLabelDate && monthLabelDate.month() !== lastMonthLabeled) {
        const newLabelX = dayLabelOffset + weekIdx * totalCellSize;
        const currentMonthText = monthLabelDate.format('MMM');

        if (monthLabels.length > 0) {
          const prevLabel = monthLabels[monthLabels.length - 1];
          if (
            newLabelX - prevLabel.x < 2 * totalCellSize &&
            currentMonthText === prevLabel.text
          ) {
            // Skip
          } else {
            monthLabels.push({ text: currentMonthText, x: newLabelX });
            lastMonthLabeled = monthLabelDate.month();
          }
        } else {
          monthLabels.push({ text: currentMonthText, x: newLabelX });
          lastMonthLabeled = monthLabelDate.month();
        }
      }
    });
  }

  const heatmapWidth =
    dayLabelOffset + numWeeksToRender * totalCellSize - DEFAULT_SQUARE_MARGIN;
  const heatmapHeight =
    monthLabelOffset + DAYS_IN_WEEK * totalCellSize - DEFAULT_SQUARE_MARGIN;

  const isDateInDataRange = (dateToCheck: dayjs.Dayjs): boolean => {
    return (
      !dateToCheck.isBefore(djsDisplayDataStartDate, 'day') &&
      !dateToCheck.isAfter(djsDisplayDataEndDate, 'day')
    );
  };

  useLayoutEffect(() => {
    if (viewWidth && numWeeksToRender > 0) {
      const CONTAINER_PADDING_HORIZONTAL = 20;
      const availableWidthForSvgContent =
        viewWidth - 2 * CONTAINER_PADDING_HORIZONTAL;

      const currentDayLabelOffset = repetitiveTaskTemplate
        ? DAY_LABEL_WIDTH
        : 0;

      const widthForSquaresAndTheirMargins =
        availableWidthForSvgContent - currentDayLabelOffset;

      let newSquareSize =
        (widthForSquaresAndTheirMargins + DEFAULT_SQUARE_MARGIN) /
          numWeeksToRender -
        DEFAULT_SQUARE_MARGIN;

      newSquareSize = Math.max(newSquareSize, 2);

      setDynamicSquareSize(newSquareSize);
    }
  }, [numWeeksToRender, repetitiveTaskTemplate, viewWidth]);

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        px: '20px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {viewWidth && (
        <>
          <svg height={heatmapHeight} width={heatmapWidth}>
            <g>
              {showMonthLabels &&
                monthLabels.map((label) => (
                  <text
                    key={`month-${label.text}`}
                    x={label.x}
                    y={MONTH_LABEL_HEIGHT - 6}
                    fontSize={10}
                    fontFamily="Hanken Grotesk, sans-serif"
                    fill="#888888"
                    textAnchor="start"
                  >
                    {label.text}
                  </text>
                ))}

              {repetitiveTaskTemplate &&
                WEEK_DAY_CONFIG.map((dayConfig, index) => {
                  const isScheduledDay =
                    repetitiveTaskTemplate.schedule ===
                      TaskScheduleTypeEnum.SpecificDaysInAWeek &&
                    repetitiveTaskTemplate[dayConfig.key];

                  return (
                    <text
                      key={`day-label-${dayConfig.key}`}
                      x={DAY_LABEL_WIDTH - 10}
                      y={
                        monthLabelOffset +
                        index * totalCellSize +
                        squareSize / 2 +
                        4
                      }
                      fontSize={9}
                      fontFamily="Hanken Grotesk, sans-serif"
                      fill={
                        isScheduledDay ? theme.palette.primary.main : '#888888'
                      }
                      textAnchor="end"
                      dominantBaseline="central"
                    >
                      {dayConfig.label}
                    </text>
                  );
                })}

              {weeksGrid.map((weekDays, weekIdx) => {
                const firstDayStr = weekDays[0].format('YYYY-MM-DD');
                return (
                  <g
                    key={`week-${firstDayStr}`}
                    transform={`translate(${dayLabelOffset + weekIdx * totalCellSize}, ${monthLabelOffset})`}
                  >
                    {weekDays.map((day, dayOfWeekIdx) => {
                      const dateStr = day.format('YYYY-MM-DD');
                      const taskForDay = taskMap.get(dateStr);

                      const isFirstDayOfMonth = day.date() === 1;
                      const showDateText =
                        isDateInDataRange(day) &&
                        isFirstDayOfMonth &&
                        dynamicSquareSize >= 15;

                      let cellColor: string;

                      if (isDateInDataRange(day)) {
                        cellColor = getColorForTask(taskForDay);
                      } else {
                        cellColor = scoreColorConfigs.padding;
                      }

                      const isDisabled = !isDateInDataRange(day) || !onDayPress;

                      return (
                        <g
                          key={dateStr}
                          transform={`translate(0, ${dayOfWeekIdx * totalCellSize})`}
                        >
                          <rect
                            width={dynamicSquareSize}
                            height={dynamicSquareSize}
                            fill={cellColor}
                            rx={2}
                            ry={2}
                            style={{
                              cursor: isDisabled ? 'default' : 'pointer',
                              transition: 'fill 0.2s ease',
                            }}
                            onClick={() => {
                              if (!isDisabled && onDayPress) {
                                // API call or state update can be handled inside onDayPress handler prop
                                onDayPress(dateStr, taskForDay);
                              }
                            }}
                          />
                          {showDateText && (
                            <text
                              x={dynamicSquareSize / 2}
                              y={dynamicSquareSize / 2}
                              fontSize={12}
                              fill="#333333"
                              dominantBaseline="middle"
                              textAnchor="middle"
                              style={{
                                pointerEvents: 'none',
                                userSelect: 'none',
                              }}
                            >
                              {day.format('DD')}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </g>
          </svg>

          {repetitiveTaskTemplate && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                width: '100%',
                pt: '40px',
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                <Box
                  sx={{
                    height: 20,
                    width: 20,
                    m: '2px',
                    borderRadius: '2px',
                    backgroundColor: scoreColorConfigs.failed,
                  }}
                />
                {repetitiveTaskTemplate.shouldBeScored && (
                  <>
                    <Box
                      sx={{
                        height: 20,
                        width: 20,
                        m: '2px',
                        borderRadius: '2px',
                        backgroundColor: scoreColorConfigs.score1,
                      }}
                    />
                    <Box
                      sx={{
                        height: 20,
                        width: 20,
                        m: '2px',
                        borderRadius: '2px',
                        backgroundColor: scoreColorConfigs.score2,
                      }}
                    />
                    <Box
                      sx={{
                        height: 20,
                        width: 20,
                        m: '2px',
                        borderRadius: '2px',
                        backgroundColor: scoreColorConfigs.score3,
                      }}
                    />
                    <Box
                      sx={{
                        height: 20,
                        width: 20,
                        m: '2px',
                        borderRadius: '2px',
                        backgroundColor: scoreColorConfigs.score4,
                      }}
                    />
                  </>
                )}
                <Box
                  sx={{
                    height: 20,
                    width: 20,
                    m: '2px',
                    borderRadius: '2px',
                    backgroundColor: scoreColorConfigs.score5,
                  }}
                />
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

HabitHeatmap.defaultProps = {
  repetitiveTaskTemplate: undefined,
  endDate: dayjs().toDate(),
  squareSize: DEFAULT_SQUARE_SIZE,
  numDays: NUM_DAYS_TO_DISPLAY,
  onDayPress: undefined,
  showMonthLabels: false,
};

export default HabitHeatmap;
