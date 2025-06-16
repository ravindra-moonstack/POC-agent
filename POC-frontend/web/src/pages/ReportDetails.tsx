import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';

// Mock data - replace with API call
const mockReport = {
  id: 1,
  clientName: 'John Smith',
  meetingDate: '2024-05-28',
  type: 'Annual Review',
  status: 'Completed',
  duration: '1 hour 30 minutes',
  location: 'Virtual Meeting',
  attendees: ['John Smith', 'Sarah Parker (RM)', 'Michael Chen (Investment Advisor)'],
  summary: `
    Comprehensive annual review meeting with John Smith. Key discussion points included:
    - Portfolio performance review
    - Risk tolerance assessment
    - Future investment goals
    - Estate planning considerations
  `,
  insights: [
    {
      id: 1,
      category: 'Investment',
      content: 'Client expressed interest in ESG investments, particularly in renewable energy sector.',
    },
    {
      id: 2,
      category: 'Family',
      content: 'Mentioned daughter Emma starting university next year - potential education planning opportunity.',
    },
    {
      id: 3,
      category: 'Lifestyle',
      content: 'Planning to purchase a vacation home in the next 2-3 years.',
    },
    {
      id: 4,
      category: 'Risk',
      content: 'Showed increased risk tolerance compared to previous assessment.',
    },
    {
      id: 5,
      category: 'Goals',
      content: 'Interested in early retirement options within the next 7-10 years.',
    },
  ],
  nextSteps: [
    'Schedule follow-up meeting to discuss ESG portfolio options',
    'Prepare education planning proposals',
    'Review vacation property financing options',
    'Update risk profile in system',
  ],
};

const ReportDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const getInsightColor = (category: string) => {
    switch (category) {
      case 'Investment':
        return 'primary';
      case 'Family':
        return 'secondary';
      case 'Lifestyle':
        return 'success';
      case 'Risk':
        return 'error';
      case 'Goals':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box className="page-container">
      <Box className="flex-between mb-4">
        <Box>
          <Typography variant="h4" color="primary">
            Meeting Report
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {mockReport.clientName} - {new Date(mockReport.meetingDate).toLocaleDateString()}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
        >
          Download Report
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Meeting Summary
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {mockReport.summary}
            </Typography>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>
              AI-Generated Insights
            </Typography>
            <Box className="flex-column gap-3">
              {mockReport.insights.map((insight) => (
                <Box key={insight.id} className="flex-column gap-2">
                  <Box className="flex-between">
                    <Chip
                      icon={<LightbulbIcon />}
                      label={insight.category}
                      color={getInsightColor(insight.category) as any}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body1">
                    {insight.content}
                  </Typography>
                  <Divider />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Meeting Details
            </Typography>
            <Box className="flex-column gap-2">
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Type
                </Typography>
                <Typography variant="body1">{mockReport.type}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="body1">{mockReport.duration}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body1">{mockReport.location}</Typography>
              </Box>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Attendees
            </Typography>
            <Box className="flex-column gap-1">
              {mockReport.attendees.map((attendee, index) => (
                <Typography key={index} variant="body1">
                  {attendee}
                </Typography>
              ))}
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>
              Next Steps
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              {mockReport.nextSteps.map((step, index) => (
                <Typography
                  key={index}
                  component="li"
                  variant="body1"
                  sx={{ mb: 1 }}
                >
                  {step}
                </Typography>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportDetails; 