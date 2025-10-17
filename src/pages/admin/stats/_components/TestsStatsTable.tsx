'use client';

import React from 'react';
import {
  Alert,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Link as MLink,
  IconButton,
  Tooltip,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import axios from 'axios';
import { ADMIN_SERVICE_URL } from '@/Envs';
import AdminClient from '@/Clients/AdminClient';
import UserDetailsModal from '@/components/ui/UserDetailsModal/UserDetailsModal';
import { UserDetails, UserRole } from '@/types';

type SessionRow = {
  session_id: number;
  user_id: number;
  status: string;
  mode: string;
  test_code: string;
  created_at: string;
  finished_at?: string | null;
  last_seen?: string | null;
  // wzbogacone ze STATS:
  accuracy?: number; // 0..1
  correct_answers?: number;
  total_answers?: number;
};

const statusChipColor = (status: string): 'default' | 'success' | 'info' | 'warning' => {
  if (status === 'active') return 'success';
  if (status === 'completed' || status === 'finished') return 'info';
  if (status === 'aborted') return 'warning';
  return 'default';
};

const accuracyColor = (pct: number) => {
  const clamped = Math.max(0, Math.min(100, pct));
  const hue = Math.round((clamped / 100) * 120);
  return `hsl(${hue}deg, 75%, 45%)`;
};

const AccuracyCell: React.FC<{
  accuracy?: number;
  correct?: number;
  total?: number;
}> = ({ accuracy, correct, total }) => {
  if (
    typeof accuracy !== 'number' ||
    typeof correct !== 'number' ||
    typeof total !== 'number' ||
    total === 0
  ) {
    return <Typography component="span">-</Typography>;
  }
  const pct = Math.round(accuracy * 100);
  return (
    <Stack spacing={0.5} sx={{ minWidth: 140 }}>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 8,
          borderRadius: 999,
          backgroundColor: 'rgba(0,0,0,0.08)',
          '& .MuiLinearProgress-bar': { backgroundColor: accuracyColor(pct) },
        }}
      />
      <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {pct}% ({correct}/{total})
      </Typography>
    </Stack>
  );
};

const TestsStatsTable: React.FC = () => {
  const [code, setCode] = React.useState('');
  const [rows, setRows] = React.useState<SessionRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [selectedUserDetails, setSelectedUserDetails] = React.useState<UserDetails | null>(null);
  const adminClient = React.useMemo(() => new AdminClient(ADMIN_SERVICE_URL), []);

  const dt = React.useMemo(
    () => new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'medium' }),
    []
  );

  const handleFetch = React.useCallback(
    async (forcedCode?: string) => {
      const c = (forcedCode ?? code).trim();
      if (!c) {
        setRows([]);
        return;
      }
      try {
        setError(null);
        setLoading(true);
        const token = sessionStorage.getItem('accessToken') || '';
        const res = await axios.get(
          `${ADMIN_SERVICE_URL}/tests/${encodeURIComponent(c)}/progress`,
          { headers: { Authorization: 'Bearer ' + token } }
        );
        const data: SessionRow[] = Array.isArray(res.data) ? res.data : [];
        data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRows(data);
      } catch {
        setError('Failed to load test sessions progress');
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [code]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFetch();
  };

  const handleViewDetails = async (userId: number) => {
    try {
      const details = await adminClient.getUserDetails(userId.toString());
      setSelectedUserDetails(details);
    } catch {
      setError('Failed to load user details');
    }
  };

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    try {
      await adminClient.updateUser(userId.toString(), { role: newRole });
      setSelectedUserDetails((prev) =>
        prev ? { ...prev, user: { ...prev.user, role: newRole } } : prev
      );
    } catch {
      setError('Failed to update role');
      throw new Error('Failed to update role');
    }
  };

  // ===== Summary metrics =====
  const { totalSessions, completedSessions, uniqueUsers, sumCorrect, sumTotal, overallPct } =
    React.useMemo(() => {
      const totalSessions = rows.length;
      const completedSessions = rows.filter(
        (r) => r.status === 'completed' || r.status === 'finished'
      ).length;
      const uniqueUsers = new Set(rows.map((r) => r.user_id)).size;
      const sumCorrect = rows.reduce((acc, r) => acc + (r.correct_answers ?? 0), 0);
      const sumTotal = rows.reduce((acc, r) => acc + (r.total_answers ?? 0), 0);
      const overallPct = sumTotal > 0 ? Math.round((sumCorrect / sumTotal) * 100) : 0;
      return { totalSessions, completedSessions, uniqueUsers, sumCorrect, sumTotal, overallPct };
    }, [rows]);

  return (
    <>
      <Paper sx={{ p: 2, mb: 2 }}>
        <form onSubmit={onSubmit}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Test code"
              placeholder="np. ABCD12"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSubmit(e as unknown as React.FormEvent);
              }}
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !code.trim()}
              sx={{ minWidth: 140 }}
            >
              Search
            </Button>
            <Tooltip title="Refresh">
              <span>
                <IconButton onClick={() => handleFetch()} disabled={loading || !code.trim()}>
                  <ReplayIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            {rows.length > 0 ? `Found ${rows.length} sessions` : 'Enter a test code and search'}
          </Typography>
        </form>
      </Paper>

      {/* SUMMARY PANEL */}
      {rows.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
          >
            <Stack spacing={1} sx={{ minWidth: 240 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Overall accuracy
              </Typography>
              <LinearProgress
                variant="determinate"
                value={overallPct}
                sx={{
                  height: 10,
                  borderRadius: 999,
                  backgroundColor: 'rgba(0,0,0,0.08)',
                  '& .MuiLinearProgress-bar': { backgroundColor: accuracyColor(overallPct) },
                }}
              />
              <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {overallPct}% ({sumCorrect}/{sumTotal})
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`Sessions: ${totalSessions}`} />
              <Chip label={`Completed: ${completedSessions}`} color="info" />
              <Chip label={`Users: ${uniqueUsers}`} />
              {code.trim() && <Chip label={`Code: ${code.trim()}`} color="default" />}
            </Stack>
          </Stack>
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Session</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Mode</TableCell>
              <TableCell>Accuracy</TableCell>
              <TableCell>Started</TableCell>
              <TableCell>Finished</TableCell>
              <TableCell>Test code</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8}>Loading…</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>No sessions</TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.session_id} hover>
                  <TableCell>{r.session_id}</TableCell>
                  <TableCell>
                    <MLink
                      component="button"
                      underline="hover"
                      onClick={() => handleViewDetails(r.user_id)}
                      sx={{ fontWeight: 600 }}
                    >
                      {r.user_id}
                    </MLink>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={r.status} color={statusChipColor(r.status)} />
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={r.mode} />
                  </TableCell>
                  <TableCell>
                    <AccuracyCell
                      accuracy={r.accuracy}
                      correct={r.correct_answers}
                      total={r.total_answers}
                    />
                  </TableCell>
                  <TableCell>{dt.format(new Date(r.created_at))}</TableCell>
                  <TableCell>{r.finished_at ? dt.format(new Date(r.finished_at)) : '-'}</TableCell>
                  <TableCell>{r.test_code}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <UserDetailsModal
        open={!!selectedUserDetails}
        onClose={() => setSelectedUserDetails(null)}
        userDetails={selectedUserDetails}
        onRoleChange={handleRoleChange}
      />
    </>
  );
};

export default TestsStatsTable;
