import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  Grid,
  Box,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuthContext } from '@/components/contexts/AuthContext';
import TopNavBar from '@/components/ui/TopNavBar/TopNavBar';
import { UserData } from '@/types';

const AccountPage = () => {
  const {
    authClient,
    userData: { userId },
  } = useAuthContext();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<UserData | null>(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    const getAccountData = async () => {
      try {
        if (userId !== null) {
          const data = await authClient.getUser();
          setUserData(data);
          setEditedData(data);
        } else {
          setError('No user ID found');
        }
      } catch (error) {
        console.error(error);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    getAccountData();
  }, [authClient, userId]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedData(userData);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editedData) return;

    try {
      // Assuming authClient has an updateUser method
      await authClient.updateUser(userId, editedData);
      setUserData(editedData);
      setIsEditing(false);
      setNotification({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success',
      });
    } catch (error) {
      console.log(error);
      setNotification({
        open: true,
        message: 'Failed to update profile',
        severity: 'error',
      });
    }
  };

  const handleChange = (field: keyof UserData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (editedData) {
      setEditedData({
        ...editedData,
        [field]: event.target.value,
      });
    }
  };

  if (loading) {
    return (
      <Box
        sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <TopNavBar />
      <Box maxWidth="lg" mx="auto" p={3}>
        <Card>
          <CardHeader
            title="Account Information"
            action={
              !isEditing ? (
                <Button
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  variant="contained"
                  color="primary"
                >
                  Edit Profile
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    variant="contained"
                    color="primary"
                  >
                    Save
                  </Button>
                  <Button
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    variant="outlined"
                    color="error"
                  >
                    Cancel
                  </Button>
                </Box>
              )
            }
          />
          <Divider />
          <CardContent>
            {error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={editedData?.firstName || ''}
                    onChange={handleChange('firstName')}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={editedData?.lastName || ''}
                    onChange={handleChange('lastName')}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={editedData?.email || ''}
                    onChange={handleChange('email')}
                    disabled
                    type="email"
                    variant="filled"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Role"
                    value={editedData?.role || ''}
                    disabled
                    variant="filled"
                  />
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
        >
          <Alert
            severity={notification.severity}
            onClose={() => setNotification({ ...notification, open: false })}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </div>
  );
};

export default AccountPage;
