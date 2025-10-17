'use client';

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
  Typography,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Alert,
  Link as MLink,
  LinearProgress,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TopNavBar from '@/components/ui/TopNavBar/TopNavBar';
import axios from 'axios';
import Link from 'next/link';
import AdminClient from '@/Clients/AdminClient';
import UserDetailsModal from '@/components/ui/UserDetailsModal/UserDetailsModal';
import { ADMIN_SERVICE_URL } from '@/Envs';
import { UserDetails, UserRole } from '@/types';

type ActiveSession = {
  id: number;
  user_id: number;
  status: string;
  mode: string;
  current_question: number;
  current_group: number;
  test_id?: number;
  test_code?: string;
  created_at: string;
  updated_at: string;
  last_seen: string;
  accuracy?: number; // 0..1
  correct_answers?: number;
  total_answers?: number;
};

const FIVE_MIN_MS = 5 * 60 * 1000;
const COMPLETED_KEEP_MS = 60 * 1000;

const statusChipColor = (status: string): 'default' | 'success' | 'info' => {
  if (status === 'active') return 'success';
  if (status === 'completed' || status === 'finished') return 'info';
  return 'default';
};

const accuracyColor = (pct: number) => {
  const clamped = Math.max(0, Math.min(100, pct));
  const hue = Math.round((clamped / 100) * 120); // 0=red, 120=green
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
          '& .MuiLinearProgress-bar': {
            backgroundColor: accuracyColor(pct),
          },
        }}
      />
      <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {pct}% ({correct}/{total})
      </Typography>
    </Stack>
  );
};

const LiveSessionsPage: React.FC = () => {
  const [rows, setRows] = React.useState<ActiveSession[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [selectedUserDetails, setSelectedUserDetails] = React.useState<UserDetails | null>(null);
  const adminClient = React.useMemo(() => new AdminClient(ADMIN_SERVICE_URL), []);

  const ghostsRef = React.useRef<Map<number, { row: ActiveSession; expiresAt: number }>>(new Map());

  const lastRowsRef = React.useRef<ActiveSession[]>([]);
  const inFlightRef = React.useRef(false);
  const timerRef = React.useRef<number | null>(null);

  const dt = React.useMemo(
    () => new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'medium' }),
    []
  );
  const timeOnly = React.useMemo(
    () => new Intl.DateTimeFormat('pl-PL', { timeStyle: 'medium' }),
    []
  );

  const fmtRel = (iso: string) => {
    const now = Date.now();
    const t = new Date(iso).getTime();
    const sec = Math.max(0, Math.round((now - t) / 1000));
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  const fetchData = React.useCallback(async () => {
    try {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      setError(null);
      const token = sessionStorage.getItem('accessToken') || '';
      const res = await axios.get(`${ADMIN_SERVICE_URL}/live/sessions/active?cutoff=5`, {
        headers: { Authorization: 'Bearer ' + token },
      });

      const raw: ActiveSession[] = Array.isArray(res.data) ? res.data : [];
      const now = Date.now();

      const fresh = raw.filter(
        (r) => now - new Date(r.last_seen).getTime() < FIVE_MIN_MS && !r.test_code?.includes(' ')
      );

      const freshIds = new Set(fresh.map((r) => r.id));

      lastRowsRef.current.forEach((prevRow) => {
        if (!freshIds.has(prevRow.id)) {
          if (!ghostsRef.current.has(prevRow.id)) {
            ghostsRef.current.set(prevRow.id, {
              row: { ...prevRow, status: 'completed', last_seen: new Date().toISOString() },
              expiresAt: now + COMPLETED_KEEP_MS,
            });
          }
        }
      });

      ghostsRef.current.forEach((g, id) => {
        if (freshIds.has(id) || g.expiresAt <= now) {
          ghostsRef.current.delete(id);
        }
      });

      const ghosts: ActiveSession[] = [];
      ghostsRef.current.forEach((g) => ghosts.push(g.row));
      const merged = [...fresh, ...ghosts];

      merged.sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime());

      setRows(merged);
      lastRowsRef.current = merged;
    } catch {
      setError('Nie udało się pobrać sesji.');
      setRows([]);
      lastRowsRef.current = [];
      ghostsRef.current.clear();
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  React.useEffect(() => {
    let alive = true;

    const tick = async () => {
      if (!alive) return;
      await fetchData();
      if (!alive) return;
      timerRef.current = window.setTimeout(tick, 1000);
    };

    tick();

    return () => {
      alive = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [fetchData]);

  const handleViewDetails = async (userId: number) => {
    try {
      const details = await adminClient.getUserDetails(userId.toString());
      setSelectedUserDetails(details);
    } catch {
      setError('Nie udało się pobrać szczegółów użytkownika.');
    }
  };

  const handleRoleUpdate = async (userId: number, newRole: UserRole) => {
    try {
      await adminClient.updateUser(userId.toString(), { role: newRole });
      setSelectedUserDetails((prev) =>
        prev ? { ...prev, user: { ...prev.user, role: newRole } } : prev
      );
    } catch {
      setError('Nie udało się zaktualizować roli.');
      throw new Error('Failed to update role');
    }
  };

  return (
    <Box>
      <TopNavBar />
      <Box py={3} maxWidth="lg" mx="auto" px={{ md: 2, xs: 1 }}>
        <Typography variant="h4" gutterBottom>
          <IconButton LinkComponent={Link} href="/admin" sx={{ mr: 2 }}>
            <ArrowBackIcon color="primary" />
          </IconButton>
          Live Sessions
        </Typography>

        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box />
          <Tooltip title="Refresh now">
            <IconButton onClick={fetchData}>
              <ReplayIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Card>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Test</TableCell>
                  <TableCell>Mode</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Current Q</TableCell>
                  <TableCell>Accuracy</TableCell>
                  <TableCell>Started</TableCell>
                  <TableCell>Last seen</TableCell>
                  <TableCell>Idle</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10}>Loading…</TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10}>No active sessions</TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => {
                    const idleSec = Math.round(
                      (Date.now() - new Date(r.last_seen).getTime()) / 1000
                    );
                    const idleColor: 'default' | 'warning' | 'error' =
                      idleSec >= 300 ? 'error' : idleSec >= 60 ? 'warning' : 'default';

                    return (
                      <TableRow key={r.id} hover>
                        <TableCell>{r.id}</TableCell>
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
                        {/* nic nie wyświetlamy, jeżeli brak kodu testu */}
                        <TableCell>{r.test_code ?? ''}</TableCell>
                        <TableCell>
                          <Chip label={r.mode} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip label={r.status} size="small" color={statusChipColor(r.status)} />
                        </TableCell>
                        <TableCell>{r.current_question}</TableCell>
                        <TableCell>
                          <AccuracyCell
                            accuracy={r.accuracy}
                            correct={r.correct_answers}
                            total={r.total_answers}
                          />
                        </TableCell>
                        <TableCell>{dt.format(new Date(r.created_at))}</TableCell>
                        <TableCell>{timeOnly.format(new Date(r.last_seen))}</TableCell>
                        <TableCell>
                          <Chip label={fmtRel(r.last_seen)} size="small" color={idleColor} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
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
      </Box>
    </Box>
  );
};

export default LiveSessionsPage;
