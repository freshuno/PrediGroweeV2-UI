import React from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Chip,
  Alert,
  Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';

import AdminClient, { UserSurveyListItem } from '@/Clients/AdminClient';
import { ADMIN_SERVICE_URL } from '@/Envs';
import { UserData, UserDetails, UserRole } from '@/types';
import TopNavBar from '@/components/ui/TopNavBar/TopNavBar';
import UserDetailsModal from '@/components/ui/UserDetailsModal/UserDetailsModal';
import Link from 'next/link';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import ButtonTooltipWrapper from '@/components/ui/ButtonTooltipWrapper';
import { useAuthContext } from '@/components/contexts/AuthContext';
import axios from 'axios';

const AdminUsersPanel = () => {
  const [users, setUsers] = React.useState<UserData[]>([]);
  const [selectedUserDetails, setSelectedUserDetails] = React.useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<string | null>(null);

  const role = useAuthContext().userData.role;
  const canApprove = role === 'admin' || role === 'teacher';
  const canDelete = role === 'admin';

  const [approvedIds, setApprovedIds] = React.useState<Set<number>>(new Set());
  const [approvingIds, setApprovingIds] = React.useState<Set<number>>(new Set());

  const [surveyNames, setSurveyNames] = React.useState<
    Map<number, { name: string; surname: string }>
  >(new Map());

  const adminClient = React.useMemo(() => new AdminClient(ADMIN_SERVICE_URL), []);

  React.useEffect(() => {
    const load = async () => {
      try {
        const [usersData, approvedRes, surveys] = await Promise.all([
          adminClient.getAllUsers(),
          axios.get('/api/quiz/approved'),
          adminClient.getAllUsersSurveys(),
        ]);

        setUsers(usersData);

        const ids: number[] = approvedRes.data?.approved_user_ids || [];
        setApprovedIds(new Set(ids));

        const m = new Map<number, { name: string; surname: string }>();
        (surveys as UserSurveyListItem[]).forEach((s) => {
          const uid = s.user_id;
          const name = (s.name ?? '').trim();
          const surname = (s.surname ?? '').trim();
          if (uid && (name || surname)) {
            m.set(uid, { name, surname });
          }
        });
        setSurveyNames(m);
      } catch {
        setError('Failed to load users, approvals or surveys');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [adminClient]);

  const handleViewDetails = async (userId: string) => {
    try {
      const details = await adminClient.getUserDetails(userId);
      setSelectedUserDetails(details);
    } catch {
      setError('Failed to load user details');
    }
  };
  const handleUnapproveFromList = async (userId: number) => {
    if (!canApprove) return;
    if (!approvedIds.has(userId)) return;
    if (approvingIds.has(userId)) return;

    if (!confirm('Remove approval for this user?')) return;

    setApprovedIds((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
    setApprovingIds((prev) => {
      const next = new Set(prev);
      next.add(userId);
      return next;
    });

    try {
      await axios.post('/api/quiz/unapprove', { user_id: userId });
    } catch {
      setApprovedIds((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
      setError('Failed to unapprove user');
    } finally {
      setApprovingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleRoleUpdate = async (userId: number, newRole: UserRole) => {
    try {
      await adminClient.updateUser(userId.toString(), { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      if (selectedUserDetails) {
        setSelectedUserDetails({
          ...selectedUserDetails,
          user: { ...selectedUserDetails.user, role: newRole },
        });
      }
    } catch {
      throw new Error('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await adminClient.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id.toString() !== userId));
    } catch {
      setError('Failed to delete user');
    }
  };

  const handleApproveFromList = async (userId: number) => {
    if (!canApprove) return;
    if (approvedIds.has(userId)) return;
    if (approvingIds.has(userId)) return;

    setApprovedIds((prev) => {
      const next = new Set(prev);
      next.add(userId);
      return next;
    });
    setApprovingIds((prev) => {
      const next = new Set(prev);
      next.add(userId);
      return next;
    });

    try {
      await axios.post('/api/quiz/approve', { user_id: userId });
    } catch {
      setApprovedIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      setError('Failed to approve user');
    } finally {
      setApprovingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <TopNavBar />
      <Box py={3} maxWidth="lg" mx="auto" px={{ md: 2, xs: 1 }}>
        <Typography variant="h4" gutterBottom>
          <IconButton LinkComponent={Link} href="/admin" sx={{ mr: 2 }}>
            <ArrowBackIcon color="primary" />
          </IconButton>
          Users Management
        </Typography>

        <Card>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Verified</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Statistics</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => {
                  const isApproved = approvedIds.has(user.id);
                  const isApproving = approvingIds.has(user.id);

                  const s = surveyNames.get(user.id);
                  const firstFromSurvey = s?.name || '';
                  const lastFromSurvey = s?.surname || '';

                  const displayName = (
                    firstFromSurvey || lastFromSurvey ? `${firstFromSurvey} ${lastFromSurvey}` : ''
                  ).trim();

                  return (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{displayName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          color={user.role === 'admin' ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        {isApproved ? (
                          <ButtonTooltipWrapper
                            tooltipText="Only admins/teachers can unapprove"
                            active={!canApprove}
                          >
                            <span>
                              <Chip
                                label={isApproving ? 'Working...' : 'Yes'}
                                color="success"
                                size="small"
                                variant={canApprove ? 'outlined' : 'filled'}
                                onClick={
                                  canApprove && !isApproving
                                    ? () => handleUnapproveFromList(user.id)
                                    : undefined
                                }
                                clickable={canApprove && !isApproving}
                              />
                            </span>
                          </ButtonTooltipWrapper>
                        ) : (
                          <ButtonTooltipWrapper
                            tooltipText="Only admins/teachers can approve"
                            active={!canApprove}
                          >
                            <span>
                              <Chip
                                label={isApproving ? 'Approving...' : 'No'}
                                color={canApprove ? 'error' : 'default'}
                                size="small"
                                variant={canApprove ? 'outlined' : 'filled'}
                                onClick={
                                  canApprove && !isApproving
                                    ? () => handleApproveFromList(user.id)
                                    : undefined
                                }
                                clickable={canApprove && !isApproving}
                              />
                            </span>
                          </ButtonTooltipWrapper>
                        )}
                      </TableCell>

                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>

                      <TableCell>
                        <Link href={`/statistics?userId=${user.id}`} passHref legacyBehavior>
                          <Button component="a" variant="outlined" size="small">
                            Stats
                          </Button>
                        </Link>
                      </TableCell>

                      <TableCell>
                        <IconButton onClick={() => handleViewDetails(user.id.toString())}>
                          <InfoIcon />
                        </IconButton>
                        <ButtonTooltipWrapper
                          tooltipText="You are not allowed to delete users"
                          active={!canDelete}
                        >
                          <IconButton
                            onClick={() => {
                              setUserToDelete(user.id.toString());
                              setDeleteModalOpen(true);
                            }}
                            disabled={!canDelete}
                          >
                            <DeleteIcon color={canDelete ? 'warning' : 'disabled'} />
                          </IconButton>
                        </ButtonTooltipWrapper>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <UserDetailsModal
          open={!!selectedUserDetails}
          onClose={() => setSelectedUserDetails(null)}
          userDetails={selectedUserDetails}
          onRoleChange={handleRoleUpdate}
        />
        <ConfirmationModal
          open={deleteModalOpen}
          title="Delete User"
          message={`Are you sure you want to delete this user?`}
          onConfirm={() => {
            if (userToDelete) handleDeleteUser(userToDelete);
            setDeleteModalOpen(false);
          }}
          onCancel={() => setDeleteModalOpen(false)}
        />
      </Box>
    </Box>
  );
};

export default AdminUsersPanel;
