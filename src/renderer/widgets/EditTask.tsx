import React, { useState, useMemo } from 'react';
import { useEditor, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Button,
  Box,
  TextField,
  Typography,
  Paper,
  Popover,
  Divider,
  FormControlLabel,
} from '@mui/material';
import { StaticDatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import {
  CalendarChip,
  DescriptionEditor,
  SectionHeader,
  SmallCheckbox,
} from '../components';
import { TaskScheduleTypeEnum, ChannelsEnum } from '../types';
import { useApp } from '../context/AppProvider';

// eslint-disable-next-line import/no-relative-packages
import { Task } from '../../generated/client';

interface IEditTaskProps {
  widgetCloseFunc: (value: React.SetStateAction<boolean>) => void;
  task: Task;
}

function EditTask({ widgetCloseFunc, task }: IEditTaskProps) {
  const [taskTitle, setTaskTitle] = useState(task.title);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(
    dayjs(task.dueDate),
  );
  const [dateAnchorEl, setDateAnchorEl] = useState<HTMLDivElement | null>(null);
  const [shouldBeScored, setShouldBeScored] = useState(task.shouldBeScored);
  const { setNotifier } = useApp();

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
    if (!taskTitle) {
      return true;
    }
    if (task.schedule === TaskScheduleTypeEnum.Once) {
      return !selectedDate;
    }
    return false;
  }, [taskTitle, selectedDate, task.schedule]);

  /**
   * todo:
   * 1. add specific days in a week to isTaskReSchedulable c
   */
  const isTaskReSchedulable =
    task.schedule === TaskScheduleTypeEnum.Once ||
    task.schedule === TaskScheduleTypeEnum.Unscheduled;

  const openDueDatePicker = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (isTaskReSchedulable) setDateAnchorEl(e.currentTarget);
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

    const editedTask = {
      id: task.id,
      title: taskTitle,
      description: stringifiedDescription,
      dueDate,
      shouldBeScored,
    };

    try {
      await window.electron.ipcRenderer.invoke(
        ChannelsEnum.REQUEST_UPDATE_TASK,
        editedTask,
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

        <Box sx={{ mt: 2 }} display="flex">
          <SectionHeader mr={0.5}>Schedule:</SectionHeader>
          <Typography variant="body2">{task.schedule}</Typography>
        </Box>

        {task.schedule !== TaskScheduleTypeEnum.Unscheduled && selectedDate && (
          <CalendarChip
            clickable={isTaskReSchedulable}
            sx={{ opacity: isTaskReSchedulable ? 1 : 0.6 }}
            date={selectedDate}
            onClick={openDueDatePicker}
          />
        )}

        {(task.schedule === TaskScheduleTypeEnum.Daily ||
          task.schedule === TaskScheduleTypeEnum.SpecificDaysInAWeek) && (
          <>
            <Divider sx={{ my: 2 }} />
            <FormControlLabel
              control={
                <SmallCheckbox
                  name="scoreHabit"
                  checked={Boolean(shouldBeScored)}
                  onChange={(e) => setShouldBeScored(e.target.checked)}
                />
              }
              label={<Typography variant="body2">Score your habit?</Typography>}
              sx={{ alignSelf: 'flex-end' }}
            />
          </>
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
    </LocalizationProvider>
  );
}

export default EditTask;
