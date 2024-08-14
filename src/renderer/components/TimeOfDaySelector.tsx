import { Box, Grid } from '@mui/material';
import { TimeOfDay } from '../types';
import SectionHeader from './SectionHeader';
import CustomChip from './CustomChip';

interface TimeOfDaySelectorProps {
  onTimeClick: (time: TimeOfDay) => void;
  selectedTime: TimeOfDay | null;
}

function TimeOfDaySelector({
  selectedTime,
  onTimeClick,
}: TimeOfDaySelectorProps) {
  return (
    <Box sx={{ mt: 2 }}>
      <SectionHeader>Time of day</SectionHeader>
      <Grid container spacing={1}>
        {Object.values(TimeOfDay).map((time) => (
          <Grid item key={time}>
            <CustomChip
              label={time}
              clickable
              sx={{ textTransform: 'capitalize' }}
              color={selectedTime === time ? 'primary' : 'default'}
              onClick={() => onTimeClick(time)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default TimeOfDaySelector;
