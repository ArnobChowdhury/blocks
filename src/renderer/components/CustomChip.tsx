import { styled } from '@mui/material/styles';
import Chip from '@mui/material/Chip';

const CustomChip = styled(Chip)(({ theme }) => ({
  borderRadius: theme.spacing(0.5), // Adjust the border radius here
  padding: theme.spacing(0.5),
}));

export default CustomChip;
