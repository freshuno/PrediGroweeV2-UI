import React from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  Grid,
  Divider,
} from '@mui/material';
import { UserDetails, UserRole } from '@/types';
import { useAuthContext } from '@/components/contexts/AuthContext';
import ButtonTooltipWrapper from '../ButtonTooltipWrapper';

const UserDetailsModal: React.FC<{
  open: boolean;
  onClose: () => void;
  userDetails: UserDetails | null;
  onRoleChange: (id: number, role: UserRole) => Promise<void>;
}> = ({ open, onClose, userDetails, onRoleChange }) => {
  const role = useAuthContext().userData.role;
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!userDetails) return null;

  const handleRoleChange = async (newRole: UserRole) => {
    setIsUpdating(true);
    setError(null);
    try {
      await onRoleChange(userDetails.user.id, newRole);
    } catch {
      setError('Failed to update user role');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatAccuracy = (value: number) => `${(value * 100).toFixed(2)}%`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>User Details</DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography>
                  <strong>Name:</strong> {userDetails.user.firstName} {userDetails.user.lastName}
                </Typography>
                <Typography>
                  <strong>Email:</strong> {userDetails.user.email}
                </Typography>
                <Typography>
                  <strong>Account type:</strong>{' '}
                  {userDetails.user.googleId ? 'Google Account' : 'Regular Account'}
                </Typography>
                <Typography>
                  <strong>Created:</strong>{' '}
                  {userDetails.user.createdAt
                    ? new Date(userDetails.user.createdAt).toLocaleDateString()
                    : 'Not available'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6" gutterBottom>
                  Survey Information
                </Typography>
                {userDetails.survey ? (
                  <>
                    <Typography>
                      <strong>Gender:</strong> {userDetails.survey.gender}
                    </Typography>
                    <Typography>
                      <strong>Age:</strong> {userDetails.survey.age}
                    </Typography>
                    <Typography>
                      <strong>Country:</strong> {userDetails.survey.country}
                    </Typography>
                    <Typography>
                      <strong>Education:</strong> {userDetails.survey.education}
                    </Typography>
                    <Typography>
                      <strong>Experience:</strong> {userDetails.survey.experience}
                    </Typography>
                    <Typography>
                      <strong>Vision:</strong> {userDetails.survey.visionDefect}
                    </Typography>
                  </>
                ) : (
                  <Typography color="text.secondary">No survey data available</Typography>
                )}
              </Grid>
            </Grid>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h6" gutterBottom>
              Quiz Statistics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Classic Mode
                </Typography>
                <Typography>Total Questions: {userDetails.stats.totalQuestions.classic}</Typography>
                <Typography>Correct Answers: {userDetails.stats.correctAnswers.classic}</Typography>
                <Typography>
                  Accuracy: {formatAccuracy(userDetails.stats.accuracy.classic)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Educational Mode
                </Typography>
                <Typography>
                  Total Questions: {userDetails.stats.totalQuestions.educational}
                </Typography>
                <Typography>
                  Correct Answers: {userDetails.stats.correctAnswers.educational}
                </Typography>
                <Typography>
                  Accuracy: {formatAccuracy(userDetails.stats.accuracy.educational)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Time Limited Mode
                </Typography>
                <Typography>
                  Total Questions: {userDetails.stats.totalQuestions.timeLimited}
                </Typography>
                <Typography>
                  Correct Answers: {userDetails.stats.correctAnswers.timeLimited}
                </Typography>
                <Typography>
                  Accuracy: {formatAccuracy(userDetails.stats.accuracy.timeLimited)}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h6" gutterBottom>
              Role Management
            </Typography>
            <ButtonTooltipWrapper
              tooltipText="You are not allowed to change roles"
              active={role !== 'admin'}
            >
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>

                <Select
                  value={userDetails.user.role}
                  label="Role"
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  disabled={isUpdating || role !== 'admin'}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="teacher">Teacher</MenuItem>
                </Select>
              </FormControl>
            </ButtonTooltipWrapper>
            {error && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {error}
              </Alert>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDetailsModal;
