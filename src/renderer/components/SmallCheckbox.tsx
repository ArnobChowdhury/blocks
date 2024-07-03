import { styled, Checkbox } from '@mui/material';

const SmallCheckbox = styled(Checkbox)(({ theme }) => ({
  padding: theme.spacing(0.5), // Adjust the padding as needed
  transform: 'scale(0.8)', // Adjust the size as needed
}));

export default SmallCheckbox;
