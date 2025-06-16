import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Mock data - replace with API call
const mockReports = [
  {
    id: 1,
    clientName: 'John Smith',
    meetingDate: '2024-05-28',
    type: 'Annual Review',
    status: 'Completed',
    insights: 5,
  },
  {
    id: 2,
    clientName: 'Sarah Johnson',
    meetingDate: '2024-05-27',
    type: 'Portfolio Review',
    status: 'In Progress',
    insights: 3,
  },
  {
    id: 3,
    clientName: 'Michael Brown',
    meetingDate: '2024-05-26',
    type: 'Initial Meeting',
    status: 'Completed',
    insights: 7,
  },
  // Add more mock reports as needed
];

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredReports = mockReports.filter(
    (report) =>
      report.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box className="page-container">
      <Box className="flex-between mb-4">
        <Typography variant="h4" color="primary">
          Meeting Reports
        </Typography>
        <TextField
          placeholder="Search reports..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
      </Box>

      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Client Name</TableCell>
              <TableCell>Meeting Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>AI Insights</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredReports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{report.clientName}</TableCell>
                <TableCell>
                  {new Date(report.meetingDate).toLocaleDateString()}
                </TableCell>
                <TableCell>{report.type}</TableCell>
                <TableCell>
                  <Chip
                    label={report.status}
                    color={getStatusColor(report.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{report.insights} insights</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => navigate(`/reports/${report.id}`)}
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton color="primary">
                    <DownloadIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Reports; 