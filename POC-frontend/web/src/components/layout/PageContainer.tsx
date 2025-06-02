import React from 'react';
import { Box } from '@mui/material';
import type { BoxProps } from '@mui/material';

interface PageContainerProps extends BoxProps {
  children: React.ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, ...props }) => {
  return (
    <Box
      className="page-container"
      sx={{
        padding: '2rem',
        maxWidth: '1440px',
        margin: '0 auto',
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default PageContainer; 