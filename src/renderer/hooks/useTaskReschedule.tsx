import { useState, useCallback } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import {
  Task,
  TaskScheduleTypeEnum,
  ChannelsEnum,
  RepetitiveTaskTemplate,
} from '../types';
import { useApp } from '../context/AppProvider';
import { getNextIterationDateForRepetitiveTask } from '../utils';

function useTaskReschedule(refreshCallback?: (date: Date) => void) {
  const [requestOnGoing, setRequestOnGoing] = useState(false);
  const { todayPageDisplayDate, setNotifier } = useApp();
  const [datePickerEndDate, setDatePickerEndDate] = useState<Dayjs>();

  const onTaskReschedule = useCallback(
    async (taskId: string, rescheduledTime: Dayjs) => {
      const dueDate = rescheduledTime.toISOString();
      setRequestOnGoing(true);
      try {
        await window.electron.ipcRenderer.invoke(
          ChannelsEnum.REQUEST_TASK_RESCHEDULE,
          {
            id: taskId,
            dueDate,
          },
        );
        if (refreshCallback) {
          refreshCallback(todayPageDisplayDate.toDate());
        }
      } catch (err: any) {
        setNotifier(err.message, 'error');
      } finally {
        setRequestOnGoing(false);
      }
    },
    [refreshCallback, setNotifier, todayPageDisplayDate],
  );

  const handleDatePickerEndDate = async (task: Task) => {
    if (
      task.schedule === TaskScheduleTypeEnum.SpecificDaysInAWeek &&
      task.repetitiveTaskTemplateId &&
      task.dueDate
    ) {
      const repetitiveTaskTemplate: RepetitiveTaskTemplate =
        await window.electron.ipcRenderer.invoke(
          ChannelsEnum.REQUEST_REPETITIVE_TASK_DETAILS,
          task.repetitiveTaskTemplateId,
        );

      const nextIteration = getNextIterationDateForRepetitiveTask(
        repetitiveTaskTemplate,
        dayjs(task.dueDate),
      );

      if (!nextIteration) {
        return;
      }

      setDatePickerEndDate(nextIteration.subtract(1, 'day').startOf('day'));
    }
  };

  const resetDatePickerEndDate = () => {
    setDatePickerEndDate(undefined);
  };

  return {
    requestOnGoing,
    onTaskReschedule,
    datePickerEndDate,
    handleDatePickerEndDate,
    resetDatePickerEndDate,
  };
}

export default useTaskReschedule;
