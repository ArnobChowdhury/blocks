import React, { useEffect, useState, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  IconButton,
  useTheme,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  RepetitiveTaskTemplate,
  Task,
  ChannelsEnum,
  TaskScheduleTypeEnum,
} from '../types';
import HabitHeatmap from '../widgets/HabitHeatmap';

const FETCH_TASKS_LIMIT = 50;
const MAX_INACTIVE_TASK_AGE_DAYS = 30;

interface HabitsSection {
  title: 'Daily' | 'Specific Days in a Week';
  data: RepetitiveTaskTemplate[];
}

interface HabitCardItemProps {
  habit: RepetitiveTaskTemplate;
  onPress: () => void;
  activityBgColor?: string;
}

const centeredStyles = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  flex: 1,
  p: 3,
  minHeight: '200px',
};

const HabitCardItem: React.FC<HabitCardItemProps> = React.memo(
  ({ habit, onPress, activityBgColor }: HabitCardItemProps) => {
    const [heatmapTasks, setHeatmapTasks] = useState<Task[]>([]);
    const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
      if (!hasFetched && !isLoadingHeatmap) {
        const fetchHeatmapData = async () => {
          setIsLoadingHeatmap(true);
          try {
            const fetched: Task[] = await window.electron.ipcRenderer.invoke(
              ChannelsEnum.REQUEST_ACTIVE_TASKS_BY_TEMPLATE_ID,
              habit.id,
              FETCH_TASKS_LIMIT,
            );
            setHeatmapTasks(fetched);
            setHasFetched(true);
          } catch (e: any) {
            console.error(
              `[HabitCardItem-${habit.id}] Error fetching heatmap data:`,
              e,
            );
          } finally {
            console.log('[HabitCardItem] Heatmap data fetched.');
            setIsLoadingHeatmap(false);
          }
        };
        fetchHeatmapData();
      }
    }, [habit.id, hasFetched, isLoadingHeatmap]);

    console.log('isLoadingHeatmap', isLoadingHeatmap);
    return (
      <Card
        sx={{
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            boxShadow: 4,
          },
        }}
        onClick={onPress}
      >
        <CardHeader
          title={
            <Typography variant="body1" component="div">
              {habit.title}
            </Typography>
          }
          sx={{ pb: 1, backgroundColor: activityBgColor || 'transparent' }}
        />
        <CardContent
          sx={{
            flex: 1,
            m: 1,
            p: 1,
            minHeight: 100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            '&:last-child': { pb: 1 },
          }}
        >
          {isLoadingHeatmap && <CircularProgress size={24} sx={{ my: 2 }} />}
          {!isLoadingHeatmap && hasFetched && heatmapTasks.length > 0 && (
            <HabitHeatmap tasks={heatmapTasks} numDays={FETCH_TASKS_LIMIT} />
          )}
          {!isLoadingHeatmap && hasFetched && heatmapTasks.length === 0 && (
            <Typography
              sx={{
                textAlign: 'center',
                color: 'text.secondary',
                my: 2,
                fontSize: 12,
              }}
            >
              No recent activity
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  },
);

HabitCardItem.defaultProps = {
  activityBgColor: undefined,
};

function Habits() {
  const theme = useTheme();
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [errorLoadingTasks, setErrorLoadingTasks] = useState<string | null>(
    null,
  );

  const [habitSections, setHabitSections] = useState<HabitsSection[]>([]);
  const navigate = useNavigate();

  const fetchHabits = useCallback(async () => {
    setErrorLoadingTasks(null);

    try {
      const dailies: RepetitiveTaskTemplate[] =
        await window.electron.ipcRenderer.invoke(
          ChannelsEnum.REQUEST_TEMPLATES_WITH_RECENT_TASKS,
          TaskScheduleTypeEnum.Daily,
          MAX_INACTIVE_TASK_AGE_DAYS,
        );
      const weeklies: RepetitiveTaskTemplate[] =
        await window.electron.ipcRenderer.invoke(
          ChannelsEnum.REQUEST_TEMPLATES_WITH_RECENT_TASKS,
          TaskScheduleTypeEnum.SpecificDaysInAWeek,
          MAX_INACTIVE_TASK_AGE_DAYS,
        );

      const hbtSections: HabitsSection[] = [
        {
          title: 'Daily',
          data: dailies,
        },
        {
          title: 'Specific Days in a Week',
          data: weeklies,
        },
      ];
      setHabitSections(hbtSections);
    } catch (error: any) {
      setErrorLoadingTasks(
        error.message || 'An unknown error occurred while fetching tasks.',
      );
      setHabitSections([]);
    } finally {
      setIsLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const renderContent = () => {
    if (isLoadingTasks) {
      return (
        <Box sx={centeredStyles}>
          <CircularProgress size={48} />
          <Typography sx={{ mt: 2, fontSize: 16, color: 'text.secondary' }}>
            Loading Today&apos;s Tasks...
          </Typography>
        </Box>
      );
    }

    if (errorLoadingTasks) {
      return (
        <Box sx={centeredStyles}>
          <Typography
            sx={{
              color: 'error.main',
              textAlign: 'center',
              mb: 1,
              fontSize: 16,
              fontWeight: 'bold',
            }}
          >
            Failed to Load Tasks
          </Typography>
          <Typography
            sx={{
              color: 'error.main',
              textAlign: 'center',
              mb: 2,
              fontSize: 14,
            }}
          >
            {errorLoadingTasks}
          </Typography>
          <IconButton
            color="primary"
            onClick={fetchHabits}
            sx={{ width: 48, height: 48 }}
          >
            <RefreshIcon fontSize="large" />
          </IconButton>
        </Box>
      );
    }

    return (
      <Box sx={{ p: 2, boxSizing: 'border-box' }}>
        {habitSections.map((section) => (
          <Box key={section.title} sx={{ mb: 4 }}>
            <Typography
              variant="h5"
              sx={{ textAlign: 'center', my: 3, fontWeight: 600 }}
            >
              {section.title}
            </Typography>

            {section.data.length === 0 ? (
              <Box sx={centeredStyles}>
                <Typography sx={{ fontSize: 16, color: 'text.secondary' }}>
                  Add repetitive tasks to start tracking
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 2,
                }}
              >
                {section.data.map((item) => (
                  <HabitCardItem
                    key={item.id}
                    activityBgColor={
                      theme.palette.mode === 'dark' ? '#333' : '#eee'
                    }
                    habit={item}
                    onPress={() => {
                      navigate(`/habits/${item.id}/${item.title}`);
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
    >
      {renderContent()}
    </Box>
  );
}

export default Habits;
