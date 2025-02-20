import { useTheme } from '@mui/material';

function Clock() {
  const theme = useTheme();

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        opacity="0.2"
        d="M22 12C22 17.524 17.523 22 12 22C6.477 22 2 17.524 2 12C2 6.478 6.477 2 12 2C17.523 2 22 6.478 22 12"
        fill={theme.palette.primary.main}
      />
      <path
        d="M15.5734 15.8148C15.4424 15.8148 15.3104 15.7808 15.1894 15.7098L11.2634 13.3678C11.0374 13.2318 10.8984 12.9868 10.8984 12.7228V7.67578C10.8984 7.26178 11.2344 6.92578 11.6484 6.92578C12.0624 6.92578 12.3984 7.26178 12.3984 7.67578V12.2968L15.9584 14.4198C16.3134 14.6328 16.4304 15.0928 16.2184 15.4488C16.0774 15.6838 15.8284 15.8148 15.5734 15.8148"
        fill={theme.palette.primary.main}
      />
    </svg>
  );
}

export default Clock;
