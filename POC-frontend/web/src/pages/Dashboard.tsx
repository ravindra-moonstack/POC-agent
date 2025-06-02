import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 12,
}));

const Dashboard: React.FC = () => {
  return (
    <Box className="page-container">
      <Typography variant="h4" color="primary" gutterBottom>
        Welcome to Profiler
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Your AI-powered customer intelligence platform
      </Typography>

      <Box sx={{ 
        display: 'grid',
        gap: 3,
        mt: 4,
        gridTemplateColumns: {
          xs: '1fr',
          md: 'repeat(2, 1fr)',
          lg: 'repeat(4, 1fr)'
        }
      }}>
        <Box>
          <StyledPaper elevation={0}>
            <Typography variant="h6" gutterBottom>
              Total Clients
            </Typography>
            <Typography variant="h3" color="primary">
              128
            </Typography>
          </StyledPaper>
        </Box>
        <Box>
          <StyledPaper elevation={0}>
            <Typography variant="h6" gutterBottom>
              Recent Reports
            </Typography>
            <Typography variant="h3" color="primary">
              47
            </Typography>
          </StyledPaper>
        </Box>
        <Box>
          <StyledPaper elevation={0}>
            <Typography variant="h6" gutterBottom>
              Active RMs
            </Typography>
            <Typography variant="h3" color="primary">
              12
            </Typography>
          </StyledPaper>
        </Box>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Recent Activity
        </Typography>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="body1" color="text.secondary">
            No recent activity to display.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard; 