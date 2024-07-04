import { Dayjs } from 'dayjs';
import { ChipProps } from '@mui/material';
import CalendarIcon from '../icons/Calendar';
import CustomChip from './CustomChip';

interface ICalendarChipProps extends ChipProps {
  date: Dayjs;
}

function CalendarChip({ date, ...props }: ICalendarChipProps) {
  const { size } = props;

  return (
    <CustomChip
      label={`${date.date()} ${date.format('MMMM')}`}
      icon={<CalendarIcon isSmall={size === 'small'} />}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
}

export default CalendarChip;
