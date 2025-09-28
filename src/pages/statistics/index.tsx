import {
  Box,
  Card,
  Stack,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Collapse,
  Chip,
  Divider,
  Tabs,
  Tab,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import TopNavBar from '@/components/ui/TopNavBar/TopNavBar';
import StatsClient from '@/Clients/StatsClient';
import { STATS_SERVICE_URL } from '@/Envs';
import React, { useMemo } from 'react';
import { UserStats, QuizResults, QuizMode } from '@/types';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import QuizResultGridItem from '@/pages/quiz/_components/QuizResultGridItem';
import { useRouter } from 'next/router';

function toPct(n: number) {
  if (!Number.isFinite(n)) return '0.0%';
  return `${(n * 100).toFixed(1)}%`;
}

function normalizeMode(mode: string): QuizMode {
  const s = String(mode).toLowerCase().replace(/\s+/g, '_');
  if (s.includes('time') && s.includes('limited')) return 'timeLimited';
  if (s.includes('educ')) return 'educational';
  return 'classic';
}

function modeLabel(m: QuizMode) {
  switch (m) {
    case 'timeLimited':
      return 'Time limited';
    case 'educational':
      return 'Educational';
    default:
      return 'Classic';
  }
}

function toneFromAccuracy(a: number): 'success' | 'warning' | 'error' {
  if (a >= 0.8) return 'success';
  if (a >= 0.5) return 'warning';
  return 'error';
}

const PctBar: React.FC<{ value: number }> = ({ value }) => {
  const tone = toneFromAccuracy(value);
  return (
    <Stack spacing={0.5} alignItems="flex-end">
      <Chip
        size="small"
        label={toPct(value)}
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

const Sparkline: React.FC<{
  values: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
}> = ({ values, width = 260, height = 48, strokeWidth = 2 }) => {
  if (!values || values.length === 0) {
    return (
      <Box
        sx={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.6,
        }}
      >
        <Typography variant="caption">No data</Typography>
      </Box>
    );
  }
  const maxV = 1;
  const minV = 0;
  const n = values.length;
  const dx = width / Math.max(1, n - 1);
  const pts = values.map((v, i) => {
    const x = i * dx;
    const y = height - ((v - minV) / (maxV - minV)) * height;
    return `${x},${y}`;
  });
  const last = values[values.length - 1];
  const color = last >= 0.8 ? '#2e7d32' : last >= 0.5 ? '#ed6c02' : '#d32f2f';

  return (
    <svg width={width} height={height} role="img" aria-label="trend">
      <polyline fill="none" stroke={color} strokeWidth={strokeWidth} points={pts.join(' ')} />
    </svg>
  );
};

type AnySession = Omit<QuizResults, 'mode'> & { mode: string | QuizMode };

const SessionRow = ({
  session,
  prevAccForMode,
}: {
  session: Omit<QuizResults, 'mode'> & { mode: QuizMode };
  prevAccForMode?: number | null;
}) => {
  const [open, setOpen] = React.useState(false);
  const delta =
    prevAccForMode == null || !Number.isFinite(prevAccForMode)
      ? null
      : (session.accuracy - prevAccForMode) * 100;
  const isUp = delta !== null && delta >= 0.05;
  const isDown = delta !== null && delta <= -0.05;
  const deltaText = delta === null ? '—' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pp`;

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }} hover>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)} aria-label="toggle-details">
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>{session.sessionId}</TableCell>
        <TableCell>{new Date(session.startTime).toLocaleString()}</TableCell>
        <TableCell sx={{ textTransform: 'capitalize' }}>{modeLabel(session.mode)}</TableCell>
        <TableCell align="right">
          <Tooltip title="Total questions">
            <Chip size="small" color="info" variant="outlined" label={session.totalQuestions} />
          </Tooltip>
        </TableCell>
        <TableCell align="right">
          <Tooltip title="Correct answers">
            <Chip size="small" color="primary" variant="outlined" label={session.correctAnswers} />
          </Tooltip>
        </TableCell>
        <TableCell align="right">
          <PctBar value={session.accuracy} />
        </TableCell>
        <TableCell align="right">
          <Chip
            size="small"
            color={isUp ? 'success' : isDown ? 'error' : 'default'}
            variant={isUp || isDown ? 'filled' : 'outlined'}
            label={deltaText}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ m: 2 }}>
              <Typography variant="h6" gutterBottom>
                Question Details
              </Typography>

              {/* Responsive grid + image constraints for mobile */}
              <Grid container spacing={2}>
                {session.questions?.map((question, index) => (
                  <Grid key={question.questionId} item xs={12} sm={6} md={4}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        '& img': {
                          width: '100%',
                          height: 'auto',
                          display: 'block',
                          marginInline: 'auto',
                          objectFit: 'contain',
                          maxHeight: { xs: 160, sm: 220, md: 260 },
                        },
                        '& .MuiCard-root, & .MuiPaper-root': {
                          height: '100%',
                        },
                      }}
                    >
                      <QuizResultGridItem question={question} index={index} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

const MODES_ALL: Array<QuizMode | 'all'> = ['all', 'classic', 'timeLimited', 'educational'];

const UserStatsPage = () => {
  const statsClient = useMemo(() => new StatsClient(STATS_SERVICE_URL), []);
  const router = useRouter();

  // jeśli w URL jest ?userId=..., wymusimy pobranie danych tego usera (tryb admina)
  const forcedUserId = React.useMemo(() => {
    const raw = router.query.userId;
    const v = Array.isArray(raw) ? raw[0] : raw;
    const num = Number(v);
    return Number.isFinite(num) ? num : undefined;
  }, [router.query.userId]);

  const [overallStats, setOverallStats] = React.useState<UserStats | null>(null);
  const [sessionStats, setSessionStats] = React.useState<QuizResults[]>([]);
  const [modeTab, setModeTab] = React.useState<QuizMode | 'all'>('all');

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const [overall, sessions] = await Promise.all([
          statsClient.getUserStats(forcedUserId),
          statsClient.getSessionsStats(forcedUserId),
        ]);
        setOverallStats(overall);
        setSessionStats(sessions);
      } catch (e) {
        console.log(e);
      }
    };
    fetchStats();
  }, [statsClient, forcedUserId]);

  const visibleSessions = React.useMemo(() => {
    const normed = (sessionStats as AnySession[]).map((s) => ({
      ...s,
      mode: normalizeMode(s.mode) as QuizMode,
    }));
    if (modeTab === 'all') return normed;
    return normed.filter((s) => s.mode === modeTab);
  }, [sessionStats, modeTab]);

  const trend = React.useMemo(() => {
    const base = [...visibleSessions].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    return base.map((s) => s.accuracy);
  }, [visibleSessions]);

  const streakDays = React.useMemo(() => {
    if (sessionStats.length === 0) return 0;

    const sessionsToUse =
      modeTab === 'all'
        ? (sessionStats as AnySession[])
        : (sessionStats as AnySession[]).filter(
            (s) => normalizeMode(s.mode) === (modeTab as QuizMode)
          );

    const byDay = new Set(
      sessionsToUse.map((s) => {
        const dt = new Date(s.startTime);
        const yy = dt.getFullYear();
        const mm = `${dt.getMonth() + 1}`.padStart(2, '0');
        const dd = `${dt.getDate()}`.padStart(2, '0');
        return `${yy}-${mm}-${dd}`;
      })
    );

    const today = new Date();
    const y = today.getFullYear();
    const m = `${today.getMonth() + 1}`.padStart(2, '0');
    const d = `${today.getDate()}`.padStart(2, '0');
    const key = `${y}-${m}-${d}`;

    if (!byDay.has(key)) return 0;

    let streak = 0;
    const stepBack = (date: Date) => {
      const t = new Date(date);
      t.setDate(t.getDate() - 1);
      return t;
    };
    let cursor = today;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const yy = cursor.getFullYear();
      const mm = `${cursor.getMonth() + 1}`.padStart(2, '0');
      const dd = `${cursor.getDate()}`.padStart(2, '0');
      const k = `${yy}-${mm}-${dd}`;
      if (byDay.has(k)) {
        streak += 1;
        cursor = stepBack(cursor);
      } else {
        break;
      }
    }
    return streak;
  }, [sessionStats, modeTab]);

  const prevAccuracyBySessionId = React.useMemo(() => {
    const byMode: Record<string, AnySession[]> = {};
    (sessionStats as AnySession[]).forEach((s) => {
      const key = normalizeMode(s.mode);
      if (!byMode[key]) byMode[key] = [];
      byMode[key].push(s);
    });
    Object.values(byMode).forEach((arr) =>
      arr.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    );
    const map = new Map<number, number | null>();
    Object.values(byMode).forEach((arr) => {
      let prev: number | null = null;
      arr.forEach((s) => {
        map.set(s.sessionId, prev);
        prev = s.accuracy;
      });
    });
    return map;
  }, [sessionStats]);

  const summary = React.useMemo(() => {
    if (!overallStats) return null;

    const modes: QuizMode[] = ['classic', 'timeLimited', 'educational'];

    const total = (m?: QuizMode) =>
      m
        ? overallStats.totalQuestions[m] || 0
        : modes.reduce((acc, k) => acc + (overallStats.totalQuestions[k] || 0), 0);

    const correct = (m?: QuizMode) =>
      m
        ? overallStats.correctAnswers[m] || 0
        : modes.reduce((acc, k) => acc + (overallStats.correctAnswers[k] || 0), 0);

    const acc = (m?: QuizMode) => {
      const t = total(m);
      return t > 0 ? correct(m) / t : 0;
    };

    const m = modeTab === 'all' ? undefined : (modeTab as QuizMode);

    return {
      title: modeTab === 'all' ? 'All modes' : modeLabel(modeTab as QuizMode),
      totalAnswers: total(m),
      correctAnswers: correct(m),
      accuracy: acc(m),
    };
  }, [overallStats, modeTab]);

  const isAdminView = forcedUserId != null;

  return (
    <Box>
      <TopNavBar />
      <Stack
        component="main"
        spacing={4}
        sx={{
          maxWidth: '1200px',
          width: '100%',
          marginX: 'auto',
          marginTop: 4,
          padding: 2,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h4">
            {isAdminView ? `User ${forcedUserId} progress` : 'Your progress'}
          </Typography>
          {isAdminView && (
            <Chip size="small" label="Admin view" color="secondary" variant="outlined" />
          )}
        </Stack>

        <Card>
          <Tabs
            value={modeTab}
            onChange={(_, v) => setModeTab(v as QuizMode | 'all')}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
          >
            {MODES_ALL.map((m) => (
              <Tab key={m} value={m} label={m === 'all' ? 'All' : modeLabel(m as QuizMode)} />
            ))}
          </Tabs>
          <Divider />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 2 }}>
            <Paper sx={{ p: 2, flex: 1 }}>
              <Typography variant="overline">Total answers</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {summary?.totalAnswers ?? 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Correct: <strong>{summary?.correctAnswers ?? 0}</strong>
              </Typography>
            </Paper>

            <Paper sx={{ p: 2, flex: 1 }}>
              <Typography variant="overline">Overall accuracy</Typography>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {toPct(summary?.accuracy ?? 0)}
                </Typography>
                <PctBar value={summary?.accuracy ?? 0} />
              </Stack>
            </Paper>

            <Paper sx={{ p: 2, flex: 1 }}>
              <Typography variant="overline">Recent trend (last sessions)</Typography>
              <Sparkline values={trend} />
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                <Chip size="small" variant="outlined" label={`Streak: ${streakDays} days`} />
              </Stack>
            </Paper>
          </Stack>
        </Card>

        <Typography variant="h5">Quiz sessions history</Typography>
        <Card>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="50px" />
                  <TableCell>Quiz session ID</TableCell>
                  <TableCell>Started</TableCell>
                  <TableCell>Mode</TableCell>
                  <TableCell align="right">Questions</TableCell>
                  <TableCell align="right">Correct</TableCell>
                  <TableCell align="right">Accuracy</TableCell>
                  <TableCell align="right">Δ vs prev</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleSessions.map((session) => (
                  <SessionRow
                    key={session.sessionId}
                    session={session}
                    prevAccForMode={prevAccuracyBySessionId.get(session.sessionId) ?? null}
                  />
                ))}
                {visibleSessions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Stack>
    </Box>
  );
};

export default UserStatsPage;
