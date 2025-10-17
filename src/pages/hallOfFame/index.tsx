import TopNavBar from '@/components/ui/TopNavBar/TopNavBar';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
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
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import React from 'react';
import axios from 'axios';
import AuthClient from '@/Clients/AuthClient';
import { AUTH_SERVICE_URL } from '@/Envs';

type Row = {
  user_id: number;
  education: string | null;
  country: string | null;
  total_answers: number;
  correct_answers: number;
  accuracy: number; // 0..1
};

function pct(n: number) {
  if (!Number.isFinite(n)) return '0.0%';
  return `${(n * 100).toFixed(1)}%`;
}

function medalForRank(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '';
}

function accuracyTone(n: number): 'success' | 'warning' | 'error' {
  if (n >= 0.8) return 'success';
  if (n >= 0.5) return 'warning';
  return 'error';
}

const AccuracyCell: React.FC<{ value: number }> = ({ value }) => {
  const tone = accuracyTone(value);
  return (
    <Stack spacing={0.5} alignItems="flex-end">
      <Chip
        size="small"
        label={pct(value)}
        color={tone}
        variant="outlined"
        sx={{ fontWeight: 600 }}
      />
      <LinearProgress
        variant="determinate"
        value={Math.max(0, Math.min(100, value * 100))}
        color={tone}
        sx={{ width: 120, height: 6, borderRadius: 5 }}
      />
    </Stack>
  );
};

const HallOfFamePage = () => {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  // UI state
  const [q, setQ] = React.useState('');
  const [minAnswers, setMinAnswers] = React.useState<number>(10);
  const [sortKey, setSortKey] = React.useState<'rank' | 'answers' | 'accuracy'>('accuracy');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');

  const [myId, setMyId] = React.useState<number | null>(null);
  React.useEffect(() => {
    const fetchMe = async () => {
      try {
        const auth = new AuthClient(AUTH_SERVICE_URL);
        const me = await auth.getUser(); // { id, ... }
        if (me?.id != null) setMyId(me.id as number);
      } catch {
        setMyId(null);
      }
    };
    fetchMe();
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await axios.get<Row[]>('/api/stats/leaderboard', {
        params: { limit: 1000, minAnswers },
      });
      setRows(resp.data || []);
    } catch {
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [minAnswers]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = rows.filter((r) => r.total_answers >= minAnswers);
    if (!s) return base;
    return base.filter((r) => {
      const idMatch = r.user_id.toString().includes(s);
      const eduMatch = (r.education || '').toLowerCase().includes(s);
      const ctryMatch = (r.country || '').toLowerCase().includes(s);
      return idMatch || eduMatch || ctryMatch;
    });
  }, [rows, q, minAnswers]);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      switch (sortKey) {
        case 'answers': {
          const av = a.total_answers;
          const bv = b.total_answers;
          if (av === bv) return 0;
          const res = av < bv ? -1 : 1;
          return sortDir === 'asc' ? res : -res;
        }
        case 'accuracy': {
          const av = a.accuracy;
          const bv = b.accuracy;
          if (av === bv) {
            // tie-breaker: total answers desc
            const ta = a.total_answers - b.total_answers;
            if (ta !== 0) return sortDir === 'asc' ? ta : -ta;
            return 0;
          }
          const res = av < bv ? -1 : 1;
          return sortDir === 'asc' ? res : -res;
        }
        case 'rank':
        default:
          return 0; // rank = pozycja po sortowaniu accuracy; nie sortujemy dodatkowo
      }
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const myIndex = React.useMemo(
    () => (myId ? sorted.findIndex((r) => r.user_id === myId) : -1),
    [sorted, myId]
  );

  const top10 = React.useMemo(() => sorted.slice(0, 10), [sorted]);
  const rowsToShow = React.useMemo(() => {
    if (myIndex >= 10) {
      return [...top10, sorted[myIndex]];
    }
    return top10;
  }, [top10, sorted, myIndex]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'rank' ? 'asc' : 'desc');
    }
  };

  const rankOf = (userId: number) => {
    const idx = sorted.findIndex((r) => r.user_id === userId);
    return idx >= 0 ? idx + 1 : null;
  };

  if (loading) {
    return (
      <Box>
        <TopNavBar />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Loading...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <TopNavBar />
      <Box py={3} maxWidth="lg" mx="auto" px={{ md: 2, xs: 1 }}>
        <Typography variant="h4" gutterBottom>
          <IconButton LinkComponent={Link} href="/" sx={{ mr: 2 }}>
            <ArrowBackIcon color="primary" />
          </IconButton>
          Hall of Fame
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Card>
          <CardHeader title="Top users by accuracy" />
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2} alignItems="center">
              <TextField
                label="Search (user id, education, country)"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                }}
                fullWidth
              />

              <TextField
                label="Min answers"
                type="number"
                value={minAnswers}
                onKeyDown={(e) => {
                  if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                }}
                inputProps={{ min: 0, step: 1, inputMode: 'numeric' }}
                onChange={(e) => {
                  const v = e.target.value;
                  const n = v === '' ? 0 : Number.parseInt(v, 10);
                  setMinAnswers(Number.isFinite(n) ? Math.max(0, n) : 0);
                }}
                sx={{ width: 180 }}
              />
            </Stack>

            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell onClick={() => toggleSort('rank')} sx={{ cursor: 'pointer' }}>
                      Rank {sortKey === 'rank' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                    </TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Education</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell
                      align="right"
                      onClick={() => toggleSort('answers')}
                      sx={{ cursor: 'pointer' }}
                    >
                      Answers {sortKey === 'answers' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                    </TableCell>
                    <TableCell align="right">Correct</TableCell>
                    <TableCell
                      align="right"
                      onClick={() => toggleSort('accuracy')}
                      sx={{ cursor: 'pointer' }}
                    >
                      Accuracy {sortKey === 'accuracy' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rowsToShow.map((r, i) => {
                    const rank = rankOf(r.user_id)!; // istnieje, bo r pochodzi z `sorted`
                    const medal = medalForRank(rank);
                    const isMe = myId && r.user_id === myId;

                    return (
                      <TableRow
                        key={`${r.user_id}-${i}`}
                        hover
                        sx={{
                          ...(isMe
                            ? { backgroundColor: 'rgba(25, 118, 210, 0.06)' } // delikatne wyróżnienie mojego wiersza
                            : {}),
                        }}
                      >
                        <TableCell>
                          <Typography fontWeight={600}>
                            {medal ? `${medal} ` : ''}
                            {rank}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            <strong>#{r.user_id}</strong>
                            {isMe ? ' (you)' : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>{r.education || '—'}</TableCell>
                        <TableCell>{r.country || '—'}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Total answers">
                            <Chip
                              size="small"
                              label={r.total_answers}
                              sx={{ fontWeight: 600 }}
                              color="info"
                              variant="outlined"
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Correct answers">
                            <Chip
                              size="small"
                              label={r.correct_answers}
                              sx={{ fontWeight: 600 }}
                              color="primary"
                              variant="outlined"
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">
                          <AccuracyCell value={r.accuracy} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {myIndex >= 10 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ opacity: 0.6, py: 1 }}>
                        …
                      </TableCell>
                    </TableRow>
                  )}
                  {rowsToShow.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default HallOfFamePage;
