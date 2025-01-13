import { useTheme } from '@mui/material';

function ArrowDown() {
  const theme = useTheme();

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        opacity="0.4"
        d="M22.0002 11.9999C22.0002 17.5149 17.5142 21.9999 12.0002 21.9999C6.48624 21.9999 2.00024 17.5149 2.00024 11.9999C2.00024 6.48589 6.48624 1.99989 12.0002 1.99989C17.5142 1.99989 22.0002 6.48589 22.0002 11.9999Z"
        fill={theme.palette.primary.main}
      />
      <path
        d="M16.2209 10.5575C16.2209 10.7485 16.1479 10.9405 16.0019 11.0865L12.5319 14.5735C12.3909 14.7145 12.1999 14.7935 11.9999 14.7935C11.8009 14.7935 11.6099 14.7145 11.4689 14.5735L7.99695 11.0865C7.70495 10.7935 7.70495 10.3195 7.99895 10.0265C8.29295 9.7345 8.76795 9.7355 9.05995 10.0285L11.9999 12.9815L14.9399 10.0285C15.2319 9.7355 15.7059 9.7345 15.9999 10.0265C16.1479 10.1725 16.2209 10.3655 16.2209 10.5575Z"
        fill={theme.palette.primary.main}
      />
    </svg>
  );
}

export default ArrowDown;
