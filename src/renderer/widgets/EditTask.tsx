import React, { useState, useMemo } from 'react';
import { useEditor, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Button,
  Box,
  Grid,
  TextField,
  Typography,
  Paper,
  Popover,
  FormControlLabel,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Checkbox,
  styled,
  useTheme,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { StaticDatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import {
  CalendarChip,
  DescriptionEditor,
  SectionHeader,
  TimeOfDaySelector,
  Selector,
} from '../components';
import {
  TaskScheduleTypeEnum,
  ChannelsEnum,
  TimeOfDay,
  TaskCompletionStatusEnum,
  DaysInAWeek,
  TaskWithTagsAndSpace,
  RepetitiveTaskWithTagsAndSpace,
  Space,
} from '../types';
import CustomChip from '../components/CustomChip';
import { useApp } from '../context/AppProvider';
import { useSpace } from '../hooks';
import { getNextIterationDateForRepetitiveTask } from '../utils';

const MenuItemStyled = styled(MenuItem)(({ theme }) => ({
  textTransform: 'capitalize',
  fontSize: theme.typography.body2.fontSize,
}));

interface IEditTaskProps {
  widgetCloseFunc: () => void;
  task: TaskWithTagsAndSpace | RepetitiveTaskWithTagsAndSpace;
  openRepetitiveTaskTemplate?: (repetitiveTaskTemplateId: string) => void;
}

function EditTask({
  widgetCloseFunc,
  task,
  openRepetitiveTaskTemplate,
}: IEditTaskProps) {
  const isRepetitiveTaskTemplate = !('repetitiveTaskTemplateId' in task);
  const isRepetitiveTaskTemplateAndSpecificDaysInAWeek =
    isRepetitiveTaskTemplate &&
    task.schedule === TaskScheduleTypeEnum.SpecificDaysInAWeek;

  const days: DaysInAWeek[] = [];
  if (isRepetitiveTaskTemplateAndSpecificDaysInAWeek) {
    if (task.monday) days.push(DaysInAWeek.Monday);
    if (task.tuesday) days.push(DaysInAWeek.Tuesday);
    if (task.wednesday) days.push(DaysInAWeek.Wednesday);
    if (task.thursday) days.push(DaysInAWeek.Thursday);
    if (task.friday) days.push(DaysInAWeek.Friday);
    if (task.saturday) days.push(DaysInAWeek.Saturday);
    if (task.sunday) days.push(DaysInAWeek.Sunday);
  }

  const [taskTitle, setTaskTitle] = useState(task.title);
  const [selectedDays, setSelectedDays] = useState<DaysInAWeek[]>(days);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(
    'dueDate' in task && task.dueDate ? dayjs(task.dueDate) : null,
  );
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<TimeOfDay | null>(
    (task.timeOfDay as TimeOfDay) || null,
  );
  const [dateAnchorEl, setDateAnchorEl] = useState<HTMLDivElement | null>(null);
  const [shouldBeScored, setShouldBeScored] = useState(task.shouldBeScored);
  const [completionStatus, setCompletionStatus] =
    useState<TaskCompletionStatusEnum | null>(
      'completionStatus' in task
        ? (task.completionStatus as TaskCompletionStatusEnum)
        : null,
    );
  const [datePickerEndDate, setDatePickerEndDate] = useState<Dayjs>();

  const [selectedSpace, setSelectedSpace] = useState<Space>(task.space);
  const { setNotifier, allSpaces, handleLoadingSpaces } = useApp();

  const { createSpace } = useSpace();

  const theme = useTheme();

  // todo editor to be reused as a hook between AddTask and EditTask
  const editor: Editor | null = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
        },
      }),
      Placeholder.configure({
        placeholder: 'Task Description',
      }),
    ],
    content: task.description || '',
  });

  const isSaveButtonDisabled = useMemo(() => {
    if (!taskTitle) return true;

    if (task.schedule === TaskScheduleTypeEnum.Once) return !selectedDate;

    if (isRepetitiveTaskTemplateAndSpecificDaysInAWeek)
      return !selectedDays.length;

    return false;
  }, [
    taskTitle,
    selectedDate,
    task.schedule,
    selectedDays,
    isRepetitiveTaskTemplateAndSpecificDaysInAWeek,
  ]);

  /**
   * todo:
   * 1. add specific days in a week to isTaskReSchedulable c
   */
  const isTaskReSchedulable = task.schedule !== TaskScheduleTypeEnum.Daily;

  const openDueDatePicker = async (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (isTaskReSchedulable) {
      setDateAnchorEl(e.currentTarget);

      if (
        !isRepetitiveTaskTemplate &&
        task.schedule === TaskScheduleTypeEnum.SpecificDaysInAWeek
      ) {
        const repetitiveTaskTemplate: RepetitiveTaskWithTagsAndSpace =
          await window.electron.ipcRenderer.invoke(
            ChannelsEnum.REQUEST_REPETITIVE_TASK_DETAILS,
            task.repetitiveTaskTemplateId,
          );
        if (!repetitiveTaskTemplate) return;

        const nextIteration = getNextIterationDateForRepetitiveTask(
          repetitiveTaskTemplate,
          dayjs(task.dueDate),
        );

        if (!nextIteration) {
          return;
        }

        setDatePickerEndDate(nextIteration.subtract(1, 'day').startOf('day'));
      }
    }
  };

  const handleDayToggle = (day: DaysInAWeek) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleTimeToggle = (time: TimeOfDay) => {
    setSelectedTimeOfDay((prev) => (prev === time ? null : time));
  };

  const showDate = Boolean(dateAnchorEl);
  const datePopOverId = showDate ? 'datepicker-popover' : undefined;

  const handleEditTask = async () => {
    let dueDate;
    if (selectedDate) {
      dueDate = selectedDate.toISOString();
    }

    let stringifiedDescription;
    if (editor) {
      stringifiedDescription = editor.getHTML();
    }

    // const selectedTagIds = selectedSpace.map((tag) => ({ id: tag.id }));
    const editedTask: Record<string, any> = {
      id: task.id,
      title: taskTitle,
      description: stringifiedDescription,
      shouldBeScored,
      timeOfDay: selectedTimeOfDay,
      schedule: task.schedule,
      // tagIds: selectedTagIds,
      spaceId: selectedSpace?.id,
    };

    if (!isRepetitiveTaskTemplateAndSpecificDaysInAWeek) {
      editedTask.dueDate = dueDate;
      editedTask.completionStatus = completionStatus;
    }

    if (isRepetitiveTaskTemplateAndSpecificDaysInAWeek)
      editedTask.days = selectedDays;

    // update: both REQUEST_UPDATE_TASK and REQUEST_UPDATE_REPETITIVE_TASK

    try {
      if (!isRepetitiveTaskTemplate)
        await window.electron.ipcRenderer.invoke(
          ChannelsEnum.REQUEST_UPDATE_TASK,
          editedTask,
        );
      else {
        await window.electron.ipcRenderer.invoke(
          ChannelsEnum.REQUEST_UPDATE_REPETITIVE_TASK,
          editedTask,
        );
      }

      widgetCloseFunc();
      setNotifier(`'${taskTitle}' updated successfully`, 'success');
    } catch (err: any) {
      setNotifier(err.message, 'error');
    }
  };

  const handleStopRepetitiveTask = async () => {
    try {
      await window.electron.ipcRenderer.invoke(
        ChannelsEnum.REQUEST_STOP_REPETITIVE_TASK,
        task.id,
      );
      widgetCloseFunc();
    } catch (err: any) {
      setNotifier(err.message, 'error');
    }
  };

  const handleSpaceCreation = async (spaceName: string) => {
    try {
      const newSpace: Space | null = await createSpace(spaceName);
      if (newSpace) {
        await handleLoadingSpaces();
        setSelectedSpace(newSpace);
      }
    } catch (err: any) {
      setNotifier(err.message, 'error');
    }
  };

  const isRepetitiveTaskButNotTemplate =
    !isRepetitiveTaskTemplate &&
    (task.schedule === TaskScheduleTypeEnum.Daily ||
      task.schedule === TaskScheduleTypeEnum.SpecificDaysInAWeek);

  return (
    <>
      <Paper sx={{ padding: 2.5, minWidth: '600px' }} variant="outlined">
        {isRepetitiveTaskButNotTemplate && (
          <Box mb={2}>
            <InfoOutlinedIcon
              sx={{
                color: 'text.secondary',
                fontSize: 16,
                marginRight: 0.5,
                float: 'left',
                mt: 0.75,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: 'info.main',
                fontSize: 12,
              }}
            >
              Editing this form will not affect the underlying template of this
              repetitive task. Would you like to edit the template instead?
            </Typography>
            <Button
              sx={{
                minWidth: 0,
                fontSize: 12,
                minHeight: 0,
                lineHeight: 1,
                ml: 1,
              }}
              variant="outlined"
              size="small"
              onClick={() => {
                if (task.repetitiveTaskTemplateId && openRepetitiveTaskTemplate)
                  openRepetitiveTaskTemplate(task.repetitiveTaskTemplateId);
              }}
            >
              Yes
            </Button>
          </Box>
        )}
        <TextField
          placeholder="Task name"
          fullWidth
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          variant="standard"
          inputProps={{
            maxLength: 1000,
            style: {
              fontWeight: 500,
            },
          }}
        />
        <DescriptionEditor editor={editor} />

        <Box sx={{ mt: 2 }} display="flex">
          <SectionHeader sx={{ marginBottom: 0 }} mr={0.5}>
            Schedule:
          </SectionHeader>
          <Typography variant="body2">{task.schedule}</Typography>
        </Box>

        {task.schedule !== TaskScheduleTypeEnum.Unscheduled && selectedDate && (
          <CalendarChip
            clickable={isTaskReSchedulable}
            sx={{ opacity: isTaskReSchedulable ? 1 : 0.6, marginTop: 1 }}
            date={selectedDate}
            onClick={openDueDatePicker}
          />
        )}

        {isRepetitiveTaskTemplateAndSpecificDaysInAWeek && (
          <Box sx={{ mt: 2 }}>
            <SectionHeader>Select Days</SectionHeader>
            <Grid container spacing={1}>
              {Object.values(DaysInAWeek).map((day) => (
                <Grid item key={day}>
                  <CustomChip
                    label={day}
                    clickable
                    sx={{ textTransform: 'capitalize' }}
                    color={selectedDays.includes(day) ? 'primary' : 'default'}
                    onClick={() => handleDayToggle(day)}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <TimeOfDaySelector
          selectedTime={selectedTimeOfDay}
          onTimeClick={handleTimeToggle}
        />

        {(task.schedule === TaskScheduleTypeEnum.Daily ||
          task.schedule === TaskScheduleTypeEnum.SpecificDaysInAWeek) && (
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                name="scoreHabit"
                checked={Boolean(shouldBeScored)}
                onChange={(e) => setShouldBeScored(e.target.checked)}
              />
            }
            label={<Typography variant="body2">Score your habit?</Typography>}
            sx={{ alignSelf: 'flex-end', pl: 0.2, mt: 1 }}
          />
        )}
        <Box
          display="flex"
          alignItems="center"
          mt={3}
          justifyContent="space-between"
        >
          {!isRepetitiveTaskTemplate && (
            <FormControl sx={{ mr: 2, display: 'block', flex: 1 }}>
              <InputLabel
                id="task-completion-status-id"
                sx={{ fontSize: theme.typography.body2.fontSize }}
              >
                Completion Status
              </InputLabel>
              <Select
                labelId="task-completion-status-id"
                value={completionStatus}
                label="Completion Status"
                onChange={(event) =>
                  setCompletionStatus(
                    event.target.value as TaskCompletionStatusEnum,
                  )
                }
                sx={{ textTransform: 'capitalize', width: '100%' }}
                size="small"
              >
                <MenuItemStyled value={TaskCompletionStatusEnum.COMPLETE}>
                  {TaskCompletionStatusEnum.COMPLETE.toLowerCase()}
                </MenuItemStyled>
                <MenuItemStyled value={TaskCompletionStatusEnum.INCOMPLETE}>
                  {TaskCompletionStatusEnum.INCOMPLETE.toLowerCase()}
                </MenuItemStyled>
                <MenuItemStyled value={TaskCompletionStatusEnum.FAILED}>
                  {TaskCompletionStatusEnum.FAILED.toLowerCase()}
                </MenuItemStyled>
              </Select>
            </FormControl>
          )}

          <Selector
            label="Space"
            options={allSpaces}
            multiple={false}
            value={selectedSpace}
            onOpen={handleLoadingSpaces}
            onOptionCreation={handleSpaceCreation}
            onChange={setSelectedSpace}
            disabled={isRepetitiveTaskButNotTemplate}
          />
        </Box>

        <Box display="flex" justifyContent="end" sx={{ mt: 2 }}>
          {isRepetitiveTaskTemplate && (
            <Button
              variant="outlined"
              onClick={handleStopRepetitiveTask}
              sx={{ mr: 1 }}
            >
              Stop Repetitive Task
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={() => widgetCloseFunc()}
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEditTask}
            disabled={isSaveButtonDisabled}
          >
            Save
          </Button>
        </Box>
      </Paper>
      <Popover
        id={datePopOverId}
        open={showDate}
        anchorEl={dateAnchorEl}
        onClose={() => setDateAnchorEl(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{
          '.MuiPaper-root': {
            boxShadow:
              '0px 3px 6px rgba(0,0,0,0.16), 0px 3px 6px rgba(0,0,0,0.23)',
          },
        }}
      >
        <StaticDatePicker
          // defaultValue={dayjs()}
          disablePast
          onChange={setSelectedDate}
          value={selectedDate}
          maxDate={datePickerEndDate}
          onClose={() => setDateAnchorEl(null)}
          onAccept={(val) => {
            if (val) {
              setSelectedDate(val);
              setDateAnchorEl(null);
              // setSelectedTypeFrequency(option);
            }
          }}
          orientation="landscape"
        />
      </Popover>
    </>
  );
}

EditTask.defaultProps = {
  openRepetitiveTaskTemplate: undefined,
};

export default EditTask;
