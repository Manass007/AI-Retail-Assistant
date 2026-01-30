import { Box, CircularProgress } from '@mui/material';

const LoadingSpinner = ({ fullScreen = false }) => {
  const content = (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight={fullScreen ? '100vh' : '200px'}
    >
      <CircularProgress />
    </Box>
  );

  return content;
};

export default LoadingSpinner;
