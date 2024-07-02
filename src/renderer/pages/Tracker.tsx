import { Typography } from '@mui/material';
import { HabitTracker } from '../widgets';

function Tracker() {
  return (
    <>
      <Typography variant="h4" component="h1" fontWeight="bold" mt={5}>
        Habit Tracker
      </Typography>
      {/* <Habit /> */}
      <HabitTracker />
    </>
  );
}

export default Tracker;
