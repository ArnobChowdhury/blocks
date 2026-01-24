import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fab, Alert, Button, Box, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import RefreshIcon from '@mui/icons-material/Refresh';
import dayjs from 'dayjs';
import { TodoList } from '../widgets';
import { PageHeader, SectionHeader } from '../components';
import { refreshTodayPageForDate, formatDate } from '../utils';
import { useApp } from '../context/AppProvider';
import { useTheme as useAppTheme } from '../context/ThemeProvider';
import {
  ChannelsEnum,
  TaskWithTags,
  TaskCompletionStatusEnum,
  TimeOfDay,
} from '../types';
import { ROUTE_OVERDUE, SectionColors } from '../constants';
import NoTaskToday from '../images/NoTaskToday';

type TasksBySection = {
  [key: string]: TaskWithTags[];
};

function Today() {
  const { themeMode } = useAppTheme();
  const isDarkMode = themeMode === 'dark';
  const navigate = useNavigate();

  const {
    setAddTaskToday,
    showAddTask,
    setShowAddTask,
    todayPageDisplayDate,
    setTodayPageDisplayDate,
    firstSyncDone,
  } = useApp();

  const [newDayBannerVisible, setNewDayBannerVisible] = useState(false);

  useEffect(() => {
    if (firstSyncDone) {
      refreshTodayPageForDate(todayPageDisplayDate.toDate());
    }
  }, [todayPageDisplayDate, firstSyncDone]);

  const [countOfTaskOverdue, setCountOfTaskOverdue] = useState(0);

  useEffect(() => {
    // sourcery skip: inline-immediately-returned-variable
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_COUNT_OF_TASKS_OVERDUE,
      (response) => setCountOfTaskOverdue(response as number),
    );
    return unsubscribe;
  }, []);

  const handleAddTaskToday = () => {
    setAddTaskToday(true);
    setShowAddTask(true);
  };

  useEffect(() => {
    if (newDayBannerVisible) {
      return () => {};
    }

    const intervalId = setInterval(() => {
      const now = dayjs().startOf('day');

      if (now.isAfter(todayPageDisplayDate)) {
        setNewDayBannerVisible(true);
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [newDayBannerVisible, todayPageDisplayDate]);

  const handleNewDayPageRefresh = () => {
    setTodayPageDisplayDate(dayjs().startOf('day'));
    setNewDayBannerVisible(false);
  };

  const [tasksBySection, setTasksBySection] = useState<TasksBySection>({
    Morning: [],
    Afternoon: [],
    Evening: [],
    Night: [],
    'Any Time': [],
    Failed: [],
  });

  const [noTasksForToday, setNoTasksForToday] = useState(false);

  useEffect(() => {
    // sourcery skip: inline-immediately-returned-variable
    const unsubscribe = window.electron.ipcRenderer.on(
      ChannelsEnum.RESPONSE_TASKS_FOR_DATE,
      (response) => {
        const tasks = response as TaskWithTags[];
        const newTasksBySection: TasksBySection = {
          Morning: [],
          Afternoon: [],
          Evening: [],
          Night: [],
          'Any Time': [],
          Failed: [],
        };

        if (tasks.length === 0) {
          setNoTasksForToday(true);
        } else {
          setNoTasksForToday(false);
        }

        tasks.forEach((task) => {
          if (task.completionStatus === TaskCompletionStatusEnum.FAILED) {
            newTasksBySection.Failed.push(task);
          } else if (task.timeOfDay === TimeOfDay.Morning) {
            newTasksBySection.Morning.push(task);
          } else if (task.timeOfDay === TimeOfDay.Afternoon) {
            newTasksBySection.Afternoon.push(task);
          } else if (task.timeOfDay === TimeOfDay.Evening) {
            newTasksBySection.Evening.push(task);
          } else if (task.timeOfDay === TimeOfDay.Night) {
            newTasksBySection.Night.push(task);
          } else {
            newTasksBySection['Any Time'].push(task);
          }
        });
        setTasksBySection(newTasksBySection);
      },
    );

    return unsubscribe;
  }, []);

  const todayFormatted = formatDate(todayPageDisplayDate);

  const orderedSections = [
    { header: 'Morning', bg: SectionColors.morning },
    { header: 'Afternoon', bg: SectionColors.afternoon },
    { header: 'Evening', bg: SectionColors.evening },
    { header: 'Night', bg: SectionColors.night },
    { header: 'Any Time', bg: SectionColors.anytime },
    { header: 'Failed', bg: SectionColors.failed },
  ];

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceList = tasksBySection[source.droppableId];
    const destList = tasksBySection[destination.droppableId];
    const movedTask = sourceList.find((t) => t.id === draggableId);

    if (!movedTask) return;

    const newTasksBySection = { ...tasksBySection };

    const newSourceList = Array.from(sourceList);
    newSourceList.splice(source.index, 1);
    newTasksBySection[source.droppableId] = newSourceList;

    const newDestList = Array.from(
      source.droppableId === destination.droppableId ? newSourceList : destList,
    );
    newDestList.splice(destination.index, 0, movedTask);
    newTasksBySection[destination.droppableId] = newDestList;

    setTasksBySection(newTasksBySection);

    const prevTask = newDestList[destination.index - 1];
    const nextTask = newDestList[destination.index + 1];

    const prevOrder = prevTask ? prevTask.sortOrder : 0;
    const nextOrder = nextTask ? nextTask.sortOrder : prevOrder + 10000;

    let newSortOrder: number;
    let reindexUpdates: { id: string; sortOrder: number }[] | null = null;

    if (nextOrder <= prevOrder + 0.00001) {
      reindexUpdates = newDestList.map((t, index) => ({
        id: t.id,
        sortOrder: (index + 1) * 10000,
      }));
      newSortOrder = (destination.index + 1) * 10000;
    } else {
      newSortOrder = (prevOrder + nextOrder) / 2;
    }

    let newTimeOfDay: TimeOfDay | null | undefined;
    let newCompletionStatus: TaskCompletionStatusEnum | undefined;

    if (destination.droppableId === 'Failed') {
      newCompletionStatus = TaskCompletionStatusEnum.FAILED;
      newTimeOfDay = movedTask.timeOfDay as TimeOfDay;
    } else {
      if (source.droppableId === 'Failed') {
        newCompletionStatus = TaskCompletionStatusEnum.INCOMPLETE;
      }

      if (destination.droppableId === 'Any Time') {
        newTimeOfDay = null;
      } else {
        newTimeOfDay = destination.droppableId.toLowerCase() as TimeOfDay;
      }
    }

    if (reindexUpdates) {
      await window.electron.ipcRenderer.invoke(
        ChannelsEnum.REQUEST_REINDEX_TASKS,
        reindexUpdates,
      );
    }

    await window.electron.ipcRenderer.invoke(
      ChannelsEnum.REQUEST_REORDER_TASK,
      {
        taskId: draggableId,
        newSortOrder,
        newTimeOfDay,
        newCompletionStatus,
      },
    );

    refreshTodayPageForDate(todayPageDisplayDate.toDate());
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <PageHeader>Today</PageHeader>
      {countOfTaskOverdue > 0 && !newDayBannerVisible && (
        <Alert
          severity="warning"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate(ROUTE_OVERDUE)}
            >
              Review now
            </Button>
          }
          sx={{
            mb: 2,
            bgcolor: isDarkMode ? 'background.paper' : undefined,
          }}
        >
          You have {countOfTaskOverdue} overdue task
          {countOfTaskOverdue > 1 ? 's' : ''}.
        </Alert>
      )}
      {newDayBannerVisible && (
        <Alert
          severity="info"
          action={
            <Button
              color="inherit"
              variant="text"
              onClick={handleNewDayPageRefresh}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
          }
          sx={{
            mb: 2,
            bgcolor: isDarkMode ? 'background.paper' : undefined,
          }}
        >
          A new day has begun! You can continue with yesterday&apos;s tasks or
          refresh to see what&apos;s new for today.
        </Alert>
      )}
      <>
        <Typography variant="h6" mt={2}>
          {todayFormatted}
        </Typography>
        {orderedSections.map(({ header, bg }) => {
          const tasks = tasksBySection[header];
          if (tasks.length === 0) return null;

          return (
            <Box
              sx={{
                background: bg,
                borderRadius: '4px',
                px: 2,
                pt: 2,
                mt: 2,
                color: 'text.onLightBackground',
              }}
              key={bg}
            >
              <SectionHeader sx={{ textTransform: 'capitalize' }}>
                {header}
              </SectionHeader>
              <TodoList
                tasks={tasks}
                refreshCallback={refreshTodayPageForDate}
                isLightBG
                droppableBlockName={header}
              />
            </Box>
          );
        })}
      </>
      {noTasksForToday && (
        <Box
          width="100%"
          height="600px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          mt={2}
        >
          <Box>
            <Typography sx={{ mb: 3 }} variant="body1" align="center">
              Empty for now. Ready to be filled with something great!
            </Typography>
            <NoTaskToday />
          </Box>
        </Box>
      )}
      {!showAddTask && (
        <Fab
          sx={{ position: 'fixed', bottom: 20, right: 20 }}
          color="secondary"
          size="small"
          aria-label="add"
          onClick={handleAddTaskToday}
        >
          <AddIcon sx={{ color: 'white' }} />
        </Fab>
      )}
    </DragDropContext>
  );
}

export default Today;
