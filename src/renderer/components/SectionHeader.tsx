import { styled } from '@mui/material/styles';
import { Typography } from '@mui/material';

const SectionHeader = styled(Typography)(({ theme }) => ({
  ...theme.typography.body2,
  marginBottom: theme.spacing(1),
  fontWeight: 500,
}));

export default SectionHeader;
