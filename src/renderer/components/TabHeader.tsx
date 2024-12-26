import { Box, Typography } from '@mui/material';

interface TabHeaderProps {
  digit: number;
  label: string;
}

function TabHeader({ digit, label }: TabHeaderProps) {
  return (
    <Box display="flex" alignItems="center">
      <Typography variant="body2" fontWeight="500">
        {label}
      </Typography>
      {digit > 0 && (
        <Box
          ml={1}
          borderRadius="50%"
          bgcolor="secondary.main"
          minWidth="24px"
          minHeight="24px"
          display="flex"
          justifyContent="center"
          alignItems="center"
          px="4px"
        >
          <Typography variant="caption" fontWeight="bold">
            {digit}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default TabHeader;
