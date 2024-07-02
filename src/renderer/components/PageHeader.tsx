import { Typography, TypographyProps } from '@mui/material';

function PageHeader(props: TypographyProps) {
  return (
    <Typography
      variant="h4"
      component="h1"
      gutterBottom
      marginTop={5}
      fontWeight="bold"
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
}

export default PageHeader;
