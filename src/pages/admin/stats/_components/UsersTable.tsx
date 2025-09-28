import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
} from '@mui/material';
import { UserDetails, UserQuizStats, UserSurvey } from '@/types';
import UserDetailsModal from '@/components/ui/UserDetailsModal/UserDetailsModal';
import { Button } from '@mui/material';
import AdminClient from '@/Clients/AdminClient';
import { ADMIN_SERVICE_URL } from '@/Envs';

type UserStatsRow = {
  userId: number;
  totalAnswers: number;
  correctAnswers: number;
  accuracy: number;
  experience: string;
  education: string;
};

type UsersTableProps = {
  stats: UserQuizStats[];
  surveys: UserSurvey[];
};

const UsersTable = ({ stats, surveys }: UsersTableProps) => {
  const [orderBy, setOrderBy] = React.useState<keyof UserStatsRow>('userId');
  const [order, setOrder] = React.useState<'asc' | 'desc'>('desc');
  const [selectedUserDetails, setSelectedUserDetails] = React.useState<UserDetails | null>(null);
  const adminClient = React.useMemo(() => new AdminClient(ADMIN_SERVICE_URL), []);

  const createSortHandler = (property: keyof UserStatsRow) => () => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const rows: UserStatsRow[] = React.useMemo(() => {
    if (!stats || !surveys) return [];
    return stats?.map((stat) => {
      const survey = surveys.find((s) => s.userId === stat.userId);
      return {
        userId: stat.userId,
        totalAnswers: stat.totalAnswers,
        correctAnswers: stat.correctAnswers,
        accuracy: stat.correctAnswers / stat.totalAnswers,
        experience: survey?.experience || 'Unknown',
        education: survey?.education || 'Unknown',
      };
    });
  }, [stats, surveys]);

  const sortedRows = React.useMemo(() => {
    return [...rows]?.sort((a, b) => {
      const comparison = order === 'asc' ? 1 : -1;
      if (a[orderBy] < b[orderBy]) return -1 * comparison;
      if (a[orderBy] > b[orderBy]) return 1 * comparison;
      return 0;
    });
  }, [rows, order, orderBy]);

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'userId'}
                  direction={orderBy === 'userId' ? order : 'asc'}
                  onClick={createSortHandler('userId')}
                >
                  User ID
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'totalAnswers'}
                  direction={orderBy === 'totalAnswers' ? order : 'asc'}
                  onClick={createSortHandler('totalAnswers')}
                >
                  Total Answers
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'correctAnswers'}
                  direction={orderBy === 'correctAnswers' ? order : 'asc'}
                  onClick={createSortHandler('correctAnswers')}
                >
                  Correct Answers
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'accuracy'}
                  direction={orderBy === 'accuracy' ? order : 'asc'}
                  onClick={createSortHandler('accuracy')}
                >
                  Accuracy
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'experience'}
                  direction={orderBy === 'experience' ? order : 'asc'}
                  onClick={createSortHandler('experience')}
                >
                  Experience
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'education'}
                  direction={orderBy === 'education' ? order : 'asc'}
                  onClick={createSortHandler('education')}
                >
                  Education
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows?.map((row) => (
              <TableRow key={row.userId}>
                <TableCell>
                  <Button
                    onClick={async () => {
                      setSelectedUserDetails(
                        await adminClient.getUserDetails(row.userId.toString())
                      );
                    }}
                  >
                    {row.userId}
                  </Button>
                </TableCell>
                <TableCell align="right">{row.totalAnswers}</TableCell>
                <TableCell align="right">{row.correctAnswers}</TableCell>
                <TableCell align="right">{(row.accuracy * 100).toFixed(1)}%</TableCell>
                <TableCell>{row.experience}</TableCell>
                <TableCell>{row.education}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <UserDetailsModal
        open={!!selectedUserDetails}
        onClose={() => setSelectedUserDetails(null)}
        userDetails={selectedUserDetails}
        onRoleChange={async (id, role) => {
          try {
            await adminClient.updateUser(id.toString(), { role: role });
          } catch (error) {
            console.error('Failed to update user role:', error);
          }
        }}
      />
    </>
  );
};

export default UsersTable;
