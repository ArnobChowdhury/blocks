import { useMemo } from 'react';
import { ListItem, Typography, Box, Chip } from '@mui/material';
import {
  DaysInAWeek,
  RepetitiveTaskWithTags,
  TaskScheduleTypeEnum,
} from '../types';
import CustomChip from './CustomChip';

interface IRepetitiveTaskListItemProps {
  task: RepetitiveTaskWithTags;
  onTaskEdit: () => void;
}

function RepetitiveTaskListItem({
  task,
  onTaskEdit,
}: IRepetitiveTaskListItemProps) {
  const { title, tags = [], schedule } = task;

  const dayLabels = useMemo(() => {
    if (schedule === TaskScheduleTypeEnum.SpecificDaysInAWeek) {
      return Object.values(DaysInAWeek).filter((day) => task[day]);
    }
    return [];
  }, [schedule, task]);

  return (
    <ListItem dense onClick={onTaskEdit} sx={{ cursor: 'pointer' }}>
      <Box display="flex" justifyContent="space-between" width="100%">
        <Box display="flex" alignItems="center">
          <Typography py="9px" variant="body2">
            {title}
          </Typography>

          {tags.map((tag) => (
            <CustomChip
              key={tag.id}
              label={tag.name}
              size="small"
              sx={{ ml: 1 }}
            />
          ))}

          {dayLabels.length > 0 && (
            <Box ml={2}>
              {dayLabels.map((day) => (
                <Chip key={day} label={day} size="small" sx={{ mr: 1 }} />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </ListItem>
  );
}

export default RepetitiveTaskListItem;
