import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  Tab,
  Tabs,
  CircularProgress,
  Button,
  Grid,
  Link,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Interests as InterestsIcon,
  Group as GroupIcon,
  Refresh as RefreshIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  GitHub as GitHubIcon,
  Article as ArticleIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../services/clientService'; 

// Types
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

interface SocialData {
  linkedIn?: {
    url: string;
    followers?: number;
  };
  twitter?: {
    handle: string;
    url: string;
    bio?: string;
  };
  github?: {
    username: string;
    url: string;
  };
}

interface EnrichedProfile {
  professional?: {
    currentRole?: {
      title: string;
      company: string;
      startDate: string;
    };
    jobHistory?: Array<{
      title: string;
      company: string;
      duration: string;
      location?: string;
      description?: string;
    }>;
    education?: Array<{
      institution: string;
      degree: string;
      field: string;
      year?: string;
    }>;
    skills?: string[];
    achievements?: Array<{
      title: string;
      description: string;
      date?: string;
    }>;
  };
  social?: SocialData;
  interests?: {
    topics?: string[];
    hobbies?: string[];
    publicActivities?: string[];
  };
  basicInfo?: {
    name: string;
    currentLocation?: string;
    profilePictureUrl?: string;
    shortBio?: string;
  };
  mediaPresence?: {
    newsArticles?: Array<{
      title: string;
      source: string;
      date: string;
      url: string;
      snippet?: string;
    }>;
    interviews?: Array<{
      title: string;
      platform: string;
      date: string;
      url: string;
    }>;
    publications?: Array<{
      title: string;
      platform: string;
      date: string;
      url: string;
      type: string;
    }>;
  };
}

interface Customer {
  customerId: string;
  name: string;
  email: string;
  companyOwnership?: Array<{
    companyName: string;
    role: string;
    ownershipPercentage?: number;
  }>;
  enrichedProfile?: EnrichedProfile;
}

// Components
const Section: React.FC<SectionProps> = ({ title, children, icon }) => (
  <Box sx={{ mb: 4 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
      {icon}
      <Typography variant="h6">{title}</Typography>
    </Box>
    {children}
  </Box>
);

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`client-tabpanel-${index}`}
    aria-labelledby={`client-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const SocialLinks: React.FC<{ social: SocialData }> = ({ social }) => (
  <Box sx={{ display: 'flex', gap: 2 }}>
    {social?.linkedIn?.url && (
      <Tooltip title="LinkedIn Profile">
        <IconButton
          component={Link}
          href={social.linkedIn.url}
          target="_blank"
          color="primary"
        >
          <LinkedInIcon />
        </IconButton>
      </Tooltip>
    )}
    {social?.twitter?.url && (
      <Tooltip title={`Twitter: @${social.twitter.handle}`}>
        <IconButton
          component={Link}
          href={social.twitter.url}
          target="_blank"
          color="primary"
        >
          <TwitterIcon />
        </IconButton>
      </Tooltip>
    )}
    {social?.github?.url && (
      <Tooltip title={`GitHub: ${social.github.username}`}>
        <IconButton
          component={Link}
          href={social.github.url}
          target="_blank"
          color="primary"
        >
          <GitHubIcon />
        </IconButton>
      </Tooltip>
    )}
  </Box>
);

const ClientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tabValue, setTabValue] = React.useState(0);
  const queryClient = useQueryClient();

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.getCustomerById(id!),
    enabled: !!id,
  });

  const enrichMutation = useMutation({
    mutationFn: async (customerId: string) => {
      if (!customer) throw new Error("Customer data not available");
      await customerService.updateCustomer(customerId, customer);
      return customerService.enrichCustomerProfile(customerId,customer);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['customer', id], data);
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEnrichProfile = () => {
    if (id && customer) {
      enrichMutation.mutate(customer.customerId);
    }
  };
  // useEffect(()=>{
  //   if (id && customer) {
  //     enrichMutation.mutate(customer.customerId);
  //   }
  // },[])

  if (isLoading || enrichMutation.isPending) {
    return (
      <Box className="page-container flex-center" sx={{ minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !customer) {
    return (
      <Box className="page-container">
        <Typography color="error">
          Error loading customer details. Please try again later.
        </Typography>
      </Box>
    );
  }

  const { enrichedProfile } = customer; 
  return (
    <Box className="page-container">
      {/* Header Section */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid xs={12} sm={6}>
            <Avatar
              src={enrichedProfile?.basicInfo?.profilePictureUrl}
              sx={{
                width: 100,
                height: 100,
                bgcolor: 'primary.main',
              }}
            >
              <PersonIcon sx={{ fontSize: 50 }} />
            </Avatar>
          </Grid>
          <Grid xs={12} sm={6} sx={{ flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom>
              {customer.name}
            </Typography>
            {enrichedProfile?.professional?.currentRole && (
              <Typography variant="h6" color="text.secondary">
                {enrichedProfile.professional.currentRole.title} at{' '}
                {enrichedProfile.professional.currentRole.company}
              </Typography>
            )}
            {enrichedProfile?.basicInfo?.currentLocation && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <LocationIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {enrichedProfile.basicInfo.currentLocation}
                </Typography>
              </Box>
            )}
          </Grid>
          <Grid xs={12} sm={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={handleEnrichProfile}
                disabled={enrichMutation.isPending}
              >
                Update Profile
              </Button>
              <SocialLinks social={enrichedProfile?.social || {}} />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<PersonIcon />} label="Profile" />
          <Tab icon={<BusinessIcon />} label="Professional" />
          <Tab icon={<InterestsIcon />} label="Interests & Media" />
          <Tab icon={<GroupIcon />} label="Network" />
        </Tabs>
      </Box>

      {/* Profile Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid xs={12} md={6}>
            <Section title="Basic Information" icon={<PersonIcon />}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon color="action" />
                      <Typography>{customer.email}</Typography>
                    </Box>
                    {enrichedProfile?.basicInfo?.shortBio && (
                      <Typography variant="body1">
                        {enrichedProfile.basicInfo.shortBio}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Section>

            <Section title="Skills & Expertise" icon={<WorkIcon />}>
              <Card variant="outlined">
                <CardContent>
                  {enrichedProfile?.professional?.skills && enrichedProfile.professional.skills.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {enrichedProfile.professional.skills.map((skill, index) => (
                        <Chip key={index} label={skill} variant="outlined" />
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography color="text.secondary">
                        No skills information available yet. Click "Update Profile" to fetch latest data.
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleEnrichProfile}
                        sx={{ mt: 2 }}
                        disabled={enrichMutation.isPending}
                      >
                        Update Profile
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Section>
          </Grid> 
          <Grid xs={12} md={6}>
            <Section title="Education" icon={<SchoolIcon />}>
              <Card variant="outlined">
                <CardContent>
                  {enrichedProfile?.professional?.education && enrichedProfile.professional.education.length > 0 ? (
                    enrichedProfile.professional.education.map((edu, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Typography variant="subtitle1">
                          {edu.degree} in {edu.field}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {edu.institution} • {edu.year || 'N/A'}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography color="text.secondary">
                        No education information available yet. Click "Update Profile" to fetch latest data.
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />} 
                        onClick={handleEnrichProfile}
                        sx={{ mt: 2 }}
                        disabled={enrichMutation.isPending}
                      >
                        Update Profile
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Section>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Professional Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid xs={12} md={8}>
            <Section title="Career History" icon={<WorkIcon />}>
              <Card variant="outlined">
                <CardContent>
                  {enrichedProfile?.professional?.jobHistory?.map((job, index) => (
                    <Box key={index} sx={{ mb: 3, pb: 2, borderBottom: index !== (enrichedProfile.professional?.jobHistory?.length || 0) - 1 ? '1px solid #eee' : 'none' }}>
                      <Typography variant="h6">{job.title}</Typography>
                      <Typography variant="subtitle1" color="text.secondary">
                        {job.company}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {job.duration} {job.location && `• ${job.location}`}
                      </Typography>
                      {job.description && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {job.description}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Section>
          </Grid>

          <Grid xs={12} md={4}>
            <Section title="Achievements" icon={<ArticleIcon />}>
              <Card variant="outlined">
                <CardContent>
                  {enrichedProfile?.professional?.achievements?.map((achievement, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography variant="subtitle1">{achievement.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {achievement.date}
                      </Typography>
                      <Typography variant="body2">{achievement.description}</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Section>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Interests & Media Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid xs={12} md={6}>
            <Section title="Interests" icon={<InterestsIcon />}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Topics of Interest
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {enrichedProfile?.interests?.topics?.map((topic, index) => (
                      <Chip key={index} label={topic} color="primary" variant="outlined" />
                    ))}
                  </Box>

                  {(enrichedProfile?.interests?.publicActivities?.length || 0) > 0 && (
                    <>
                      <Typography variant="subtitle1" gutterBottom>
                        Public Activities
                      </Typography>
                      {enrichedProfile?.interests?.publicActivities?.map((activity, index) => (
                        <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                          • {activity}
                        </Typography>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            </Section>
          </Grid>

          <Grid xs={12} md={6}>
            <Section title="Media Presence" icon={<ArticleIcon />}>
              <Card variant="outlined">
                <CardContent>
                  {enrichedProfile?.mediaPresence?.newsArticles?.map((article, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Link href={article.url} target="_blank" underline="hover">
                        <Typography variant="subtitle1">{article.title}</Typography>
                      </Link>
                      <Typography variant="body2" color="text.secondary">
                        {article.source} • {article.date}
                      </Typography>
                      {article.snippet && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {article.snippet}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Section>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Network Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid xs={12}>
            <Section title="Company Affiliations" icon={<BusinessIcon />}>
              <Card variant="outlined">
                <CardContent>
                  <Grid container spacing={3}>
                    {customer.companyOwnership?.map((company, index) => (
                      <Grid xs={12} md={6} key={index}>
                        <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                          <Typography variant="h6">{company.companyName}</Typography>
                          <Typography variant="body1" color="text.secondary">
                            {company.role}
                          </Typography>
                          {company.ownershipPercentage && (
                            <Typography variant="body2" color="primary">
                              {company.ownershipPercentage}% ownership
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Section>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default ClientDetails; 