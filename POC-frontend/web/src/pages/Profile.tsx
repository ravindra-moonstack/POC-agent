import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  TextField, 
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Person as PersonIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

// Mock data - replace with API call
const mockProfile = {
  name: 'Sarah Parker',
  role: 'Relationship Manager',
  email: 'sarah.parker@profiler.com',
  phone: '+1 (555) 987-6543',
  department: 'Wealth Management',
  location: 'New York',
  clientCount: 45,
  joinDate: '2022-03-15',
  notifications: {
    email: true,
    mobile: true,
    desktop: false,
  },
  preferences: {
    darkMode: false,
    autoReport: true,
    voiceTranscription: true,
  },
};

const Profile: React.FC = () => {
  const [profile, setProfile] = React.useState(mockProfile);
  const [isEditing, setIsEditing] = React.useState(false);

  const handleSave = () => {
    // TODO: Implement API call to save profile changes
    setIsEditing(false);
  };

  return (
    <Box className="page-container">
      <Typography variant="h4" color="primary" gutterBottom>
        Profile Settings
      </Typography>

      <Box sx={{ 
        display: 'grid',
        gap: 3,
        gridTemplateColumns: {
          xs: '1fr',
          md: '1fr 3fr'
        }
      }}>
        <Box>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Box className="flex-column items-center text-center">
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: 'primary.main',
                  mb: 2,
                }}
              >
                <PersonIcon sx={{ fontSize: 60 }} />
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {profile.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {profile.role}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {profile.department} · {profile.location}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Member since {new Date(profile.joinDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Managing {profile.clientCount} clients
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        <Box>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Box className="flex-between mb-4">
              <Typography variant="h6">Personal Information</Typography>
              <Button
                variant={isEditing ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                startIcon={isEditing ? <SaveIcon /> : null}
              >
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </Button>
            </Box>

            <Box sx={{ 
              display: 'grid',
              gap: 3,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)'
              }
            }}>
              <TextField
                fullWidth
                label="Full Name"
                value={profile.name}
                disabled={!isEditing}
              />
              <TextField
                fullWidth
                label="Email"
                value={profile.email}
                disabled={!isEditing}
              />
              <TextField
                fullWidth
                label="Phone"
                value={profile.phone}
                disabled={!isEditing}
              />
              <TextField
                fullWidth
                label="Department"
                value={profile.department}
                disabled={!isEditing}
              />
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>
              Preferences
            </Typography>

            <Box className="flex-column gap-2">
              <FormControlLabel
                control={
                  <Switch
                    checked={profile.notifications.email}
                    onChange={() => {
                      if (isEditing) {
                        setProfile({
                          ...profile,
                          notifications: {
                            ...profile.notifications,
                            email: !profile.notifications.email,
                          },
                        });
                      }
                    }}
                    disabled={!isEditing}
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={profile.notifications.mobile}
                    onChange={() => {
                      if (isEditing) {
                        setProfile({
                          ...profile,
                          notifications: {
                            ...profile.notifications,
                            mobile: !profile.notifications.mobile,
                          },
                        });
                      }
                    }}
                    disabled={!isEditing}
                  />
                }
                label="Mobile Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={profile.preferences.autoReport}
                    onChange={() => {
                      if (isEditing) {
                        setProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            autoReport: !profile.preferences.autoReport,
                          },
                        });
                      }
                    }}
                    disabled={!isEditing}
                  />
                }
                label="Auto-generate Reports"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={profile.preferences.voiceTranscription}
                    onChange={() => {
                      if (isEditing) {
                        setProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            voiceTranscription: !profile.preferences.voiceTranscription,
                          },
                        });
                      }
                    }}
                    disabled={!isEditing}
                  />
                }
                label="Voice Transcription"
              />
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Profile; 