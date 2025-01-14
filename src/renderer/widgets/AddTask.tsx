import React, { useState, useMemo, useEffect, forwardRef } from 'react';
import { useEditor, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Button,
  Box,
  TextField,
  Chip,
  Grid,
  Typography,
  Paper,
  Popover,
  Divider,
  Checkbox,
  FormControlLabel,
  Tooltip,
  IconButton,
  useTheme,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { StaticDatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import CustomChip from '../components/CustomChip';
import {
  CalendarChip,
  DescriptionEditor,
  SectionHeader,
  TimeOfDaySelector,
  Selector,
} from '../components';
import {
  TaskScheduleTypeEnum,
  TimeOfDay,
  DaysInAWeek,
  ChannelsEnum,
  Space,
} from '../types';
import { useApp } from '../context/AppProvider';
import { useSpace } from '../hooks';

interface IAddTaskProps {
  widgetCloseFunc: (value: React.SetStateAction<boolean>) => void;
  isToday?: boolean;
}

const AddTask = forwardRef<HTMLDivElement, IAddTaskProps>((props, ref) => {
  const theme = useTheme();
  const { widgetCloseFunc, isToday } = props;
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedScheduleType, setSelectedTypeFrequency] =
    useState<TaskScheduleTypeEnum>(
      isToday ? TaskScheduleTypeEnum.Once : TaskScheduleTypeEnum.Unscheduled,
    );
  const [selectedDate, setSelectedDate] = useState<Dayjs | null | undefined>(
    isToday ? dayjs() : undefined,
  );
  const [selectedDays, setSelectedDays] = useState<DaysInAWeek[]>([]);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<TimeOfDay | null>(
    null,
  );
  const [dateAnchorEl, setDateAnchorEl] = useState<HTMLDivElement | null>(null);
  const [shouldBeScored, setShouldBeScored] = useState(false);
  const { setNotifier } = useApp();

  const [selectedSpace, setSelectedSpace] = useState<Space>();

  const {
    handleLoadingSpaces,
    createSpace,
    allSpaces,
    error: spaceRequestError,
  } = useSpace();

  useEffect(() => {
    if (spaceRequestError) {
      setNotifier(spaceRequestError, 'error');
    }
  }, [spaceRequestError, setNotifier]);

  const editor: Editor | null = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false, // TODO : Making this as `false` because marks are not preserved when I try to preserve attrs, awaiting a bit of help
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false, // TODO : Making this as `false` because marks are not preserved when I try to preserve attrs, awaiting a bit of help
        },
      }),
      Placeholder.configure({
        placeholder: 'Task Description',
      }),
    ],
  });

  const isAddButtonDisabled = useMemo(() => {
    if (!taskTitle) {
      return true;
    }
    if (selectedScheduleType === TaskScheduleTypeEnum.Once) {
      return !selectedDate;
    }
    if (selectedScheduleType === TaskScheduleTypeEnum.SpecificDaysInAWeek) {
      return !selectedDays.length;
    }
    return false;
  }, [taskTitle, selectedDate, selectedScheduleType, selectedDays]);

  const handleReset = () => {
    setSelectedDate(undefined);
    setSelectedDays([]);
  };

  const handleFrequencySelect = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    frequency: TaskScheduleTypeEnum,
  ) => {
    if (frequency !== selectedScheduleType) {
      handleReset();
    }
    if (frequency === TaskScheduleTypeEnum.Once) {
      setDateAnchorEl(e.currentTarget);
    } else {
      setSelectedTypeFrequency(frequency);
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

  const handleAddTask = async () => {
    let dueDate;
    if (selectedDate) {
      dueDate = selectedDate.toISOString();
    }

    let stringifiedJson;
    if (editor) {
      stringifiedJson = editor.getHTML();
    }

    // const selectedTagIds = selectedTags.map((tag) => ({ id: tag.id }));

    const task = {
      title: taskTitle,
      description: stringifiedJson,
      schedule: selectedScheduleType,
      days: selectedDays,
      dueDate,
      shouldBeScored,
      timeOfDay: selectedTimeOfDay,
      // tagIds: selectedTagIds,
      spaceId: selectedSpace?.id,
    };

    try {
      await window.electron.ipcRenderer.invoke(
        ChannelsEnum.REQUEST_CREATE_TASK,
        task,
      );

      widgetCloseFunc(false);
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper
        ref={ref}
        sx={{ padding: 2.5, minWidth: '600px' }}
        variant="outlined"
      >
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

        <Box sx={{ mt: 2 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 3,
            }}
          >
            <SectionHeader sx={{ mb: 0 }}>Schedule</SectionHeader>
            <Tooltip
              title={
                <>
                  <Typography variant="body2" color="inherit">
                    Selecting &quot;Daily&quot; or &quot;Specific Days in a
                    Week&quot; will create a task template.
                  </Typography>
                  <Typography variant="body2" color="inherit">
                    Tasks will be generated from the template as per the
                    schedule.
                  </Typography>
                </>
              }
              placement="right"
              arrow
            >
              <IconButton size="small" aria-label="info" sx={{ ml: 0.5 }}>
                <InfoOutlinedIcon
                  sx={{
                    color: theme.palette.info.main,
                    fontSize: '16px',
                  }}
                />
              </IconButton>
            </Tooltip>
          </div>
          <Grid container spacing={1}>
            {Object.values(TaskScheduleTypeEnum).map((option, index) => (
              <>
                <Grid item key={option}>
                  <Chip
                    label={option}
                    clickable
                    color={
                      selectedScheduleType === option ? 'primary' : 'default'
                    }
                    onClick={(e) => handleFrequencySelect(e, option)}
                  />
                  {option === TaskScheduleTypeEnum.Once && (
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
                        onClose={() => setDateAnchorEl(null)}
                        onAccept={(val) => {
                          if (val) {
                            setSelectedDate(val);
                            setDateAnchorEl(null);
                            setSelectedTypeFrequency(option);
                          }
                        }}
                        orientation="landscape"
                      />
                    </Popover>
                  )}
                </Grid>
                {index === 1 && (
                  <Grid>
                    <Divider
                      key="task-schedule-divider"
                      orientation="vertical"
                      sx={{ mr: 0.5, ml: 1.5 }}
                    />
                  </Grid>
                )}
              </>
            ))}
          </Grid>
        </Box>

        {selectedScheduleType === TaskScheduleTypeEnum.SpecificDaysInAWeek && (
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
        {selectedScheduleType === TaskScheduleTypeEnum.Once && selectedDate && (
          <>
            <Divider sx={{ my: 2 }} />
            <CalendarChip date={selectedDate} />
          </>
        )}

        <TimeOfDaySelector
          selectedTime={selectedTimeOfDay}
          onTimeClick={handleTimeToggle}
        />

        {(selectedScheduleType === TaskScheduleTypeEnum.Daily ||
          selectedScheduleType ===
            TaskScheduleTypeEnum.SpecificDaysInAWeek) && (
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                name="scoreHabit"
                checked={shouldBeScored}
                onChange={(e) => setShouldBeScored(e.target.checked)}
              />
            }
            label={<Typography variant="body2">Score your habit?</Typography>}
            sx={{ alignSelf: 'flex-end', my: 2 }}
          />
        )}
        <Box mt={2}>
          <Selector
            label="Space"
            options={allSpaces}
            multiple={false}
            value={selectedSpace}
            onOpen={handleLoadingSpaces}
            onOptionCreation={handleSpaceCreation}
            onChange={setSelectedSpace}
          />
        </Box>
        <Box display="flex" justifyContent="end" sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => widgetCloseFunc(false)}
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddTask}
            disabled={isAddButtonDisabled}
          >
            Add
          </Button>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
});

export default AddTask;
AddTask.defaultProps = {
  isToday: false,
};
