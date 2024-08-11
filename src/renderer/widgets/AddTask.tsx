import React, { useState, useMemo } from 'react';
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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { StaticDatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';
import CustomChip from '../components/CustomChip';
import { CalendarChip, DescriptionEditor } from '../components';
import { TaskScheduleTypeEnum, DaysInAWeek, ChannelsEnum } from '../types';
import { useApp } from '../context/AppProvider';

const SectionHeader = styled(Typography)(({ theme }) => ({
  ...theme.typography.body2,
  marginBottom: theme.spacing(1),
  fontWeight: 500,
}));

interface IAddTaskProps {
  widgetCloseFunc: (value: React.SetStateAction<boolean>) => void;
}

function AddTask({ widgetCloseFunc }: IAddTaskProps) {
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedScheduleType, setSelectedTypeFrequency] =
    useState<TaskScheduleTypeEnum>(TaskScheduleTypeEnum.Unscheduled);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>();
  const [selectedDays, setSelectedDays] = useState<DaysInAWeek[]>([]);
  const [dateAnchorEl, setDateAnchorEl] = useState<HTMLDivElement | null>(null);
  const [shouldBeScored, setShouldBeScored] = useState(false);
  const { setNotifier } = useApp();

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

    const task = {
      title: taskTitle,
      description: stringifiedJson,
      schedule: selectedScheduleType,
      days: selectedDays,
      dueDate,
      shouldBeScored,
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper sx={{ padding: 2.5, minWidth: '600px' }} variant="outlined">
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
          <SectionHeader>Schedule</SectionHeader>
          <Grid container spacing={1}>
            {Object.values(TaskScheduleTypeEnum).map((option) => (
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

        {(selectedScheduleType === TaskScheduleTypeEnum.Daily ||
          selectedScheduleType ===
            TaskScheduleTypeEnum.SpecificDaysInAWeek) && (
          <FormControlLabel
            control={
              <Checkbox
                name="scoreHabit"
                checked={shouldBeScored}
                onChange={(e) => setShouldBeScored(e.target.checked)}
              />
            }
            label={<Typography variant="body2">Score your habit?</Typography>}
            sx={{ alignSelf: 'flex-end', my: 2 }}
          />
        )}
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
}

export default AddTask;
