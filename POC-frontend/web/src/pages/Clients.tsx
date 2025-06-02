import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  CircularProgress, 
  Alert,
  Snackbar,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '../services/clientService';
// import type { Customer } from '../services/clientService';
import SearchField from '../components/common/SearchField';
import PageContainer from '../components/layout/PageContainer';

const Clients: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showSuccess, setShowSuccess] = React.useState(false);

  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getCustomers,
  }); 
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const filteredCustomers = React.useMemo(() => {
    if (!customers) return [];
    return customers.filter((customer) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.companyOwnership?.some(co => 
          co.companyName.toLowerCase().includes(searchLower) ||
          co.role.toLowerCase().includes(searchLower)
        )
      );
    });
  }, [customers, searchTerm]);

  if (isLoading) {
    return (
      <PageContainer>
        <Box className="flex-center" sx={{ minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Typography color="error" gutterBottom>
          Error loading customers. Please try again later.
        </Typography>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Box className="flex-between mb-4">
        <Typography variant="h4" color="primary">
          Customers
        </Typography>
        <Box className="flex-center gap-2">
          <SearchField
            placeholder="Search customers..."
            value={searchTerm}
            onSearch={handleSearch}
          />
        </Box>
      </Box>

      {filteredCustomers.length === 0 ? (
        <Box className="flex-center" sx={{ minHeight: '200px' }}>
          <Typography color="text.secondary">
            No customers found. Try adjusting your search criteria.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredCustomers.map((customer) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={customer.customerId}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: (theme) => theme.shadows[4],
                  },
                }}
                onClick={() => navigate(`/clients/${customer.customerId}`)}
              >
                <CardContent>
                  <Box className="flex-between">
                    <Box className="flex-center gap-2">
                      <IconButton size="small" sx={{ bgcolor: 'primary.light' }}>
                        <PersonIcon sx={{ color: 'white' }} />
                      </IconButton>
                      <Box>
                        <Typography variant="h6">{customer.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {customer.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  {customer.companyOwnership && customer.companyOwnership.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      {customer.companyOwnership.map((company, index) => (
                        <Box key={index} className="flex-start gap-1" sx={{ mt: 1 }}>
                          <BusinessIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="body2">
                              {company.companyName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {company.role}
                              {company.ownershipPercentage && ` • ${company.ownershipPercentage}% ownership`}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {customer.enrichedProfile && (
                    <Box sx={{ mt: 2 }}>
                      {customer.enrichedProfile.professional?.currentRole && (
                        <Chip
                          size="small"
                          label={`${customer.enrichedProfile.professional.currentRole.title} at ${customer.enrichedProfile.professional.currentRole.company}`}
                          sx={{ mr: 1, mb: 1 }}
                        />
                      )}
                      {customer.enrichedProfile.social?.linkedIn && (
                        <Chip
                          size="small"
                          label="LinkedIn"
                          sx={{ mr: 1, mb: 1 }}
                          onClick={() => window.open(customer?.enrichedProfile?.social?.linkedIn?.url, '_blank')}
                        />
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Operation completed successfully!
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default Clients; 