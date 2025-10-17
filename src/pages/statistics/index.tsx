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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FavoriteIcon from '@mui/icons-material/Favorite';
import axios from 'axios';

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
    <>
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
    </>
  );
};

const MODES_ALL: Array<QuizMode | 'all'> = ['all', 'classic', 'timeLimited', 'educational'];

type FavoriteCase = {
  case_id: number;
  case_code: string;
  question_id?: number | null;
  correct?: string | null;
  gender: string;
  age1: number;
  age2: number;
  age3?: number | null;
  parameters: { id: number; name: string; description?: string; referenceValues?: string }[];
  parametersValues: {
    parameterId?: number;
    value1?: number | string | null;
    value2?: number | string | null;
    value3?: number | string | null;
  }[];
  created_at: string;
  note?: string | null;
  note_updated_at?: string | null;
};

async function updateFavoriteNote(caseId: number, note: string | null) {
  await axios.put(
    `/api/quiz/cases/${caseId}/favorite/note`,
    { note },
    { headers: { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') } }
  );
}

const FavoriteCaseCard: React.FC<{
  item: FavoriteCase;
  onRemoved: (cid: number) => void;
  onUpdated: (updated: FavoriteCase) => void;
  readOnly?: boolean;
}> = ({ item, onRemoved, onUpdated, readOnly = false }) => {
  const [img, setImg] = React.useState<Record<string, string>>({});
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [noteDraft, setNoteDraft] = React.useState<string>(item.note ?? '');
  const [noteSaving, setNoteSaving] = React.useState(false);
  const qid = item.question_id;

  React.useEffect(() => {
    const fetchImg = async (path: '1' | '2' | '3') => {
      if (!qid) return;
      try {
        const res = await axios.get(`/api/images/questions/${qid}/image/${path}`, {
          responseType: 'blob',
          headers: { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') },
        });
        setImg((prev) => ({ ...prev, [path]: URL.createObjectURL(res.data) }));
      } catch {
        // ignore
      }
    };
    if (qid) {
      fetchImg('1');
      fetchImg('2');
      fetchImg('3');
    }
  }, [qid]);

  const removeFav = async () => {
    try {
      await axios.delete(`/api/quiz/cases/${item.case_id}/favorite`, {
        headers: { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') },
      });
      onRemoved(item.case_id);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  };

  const saveNote = async () => {
    try {
      setNoteSaving(true);
      const trimmed = noteDraft.trim();
      await updateFavoriteNote(item.case_id, trimmed === '' ? null : trimmed);
      const updated: FavoriteCase = {
        ...item,
        note: trimmed === '' ? null : trimmed,
        note_updated_at: trimmed === '' ? null : new Date().toISOString(),
      };
      onUpdated(updated);
      setNoteOpen(false);
    } catch (e) {
      alert('Failed to save note.');
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setNoteSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <FavoriteIcon color="error" fontSize="small" />
        <Typography variant="h6">Patient {item.case_code}</Typography>
        <Box flex={1} />
        {!readOnly && (
          <Button
            size="small"
            onClick={() => {
              setNoteDraft(item.note ?? '');
              setNoteOpen(true);
            }}
          >
            {item.note && item.note.trim() !== '' ? 'Edit note' : 'Add note'}
          </Button>
        )}
        <Button size="small" onClick={removeFav}>
          Remove
        </Button>
      </Stack>

      <Grid container spacing={1}>
        {(['1', '2', '3'] as const).map((k) => (
          <Grid key={k} item xs={12} sm={4}>
            {img[k] ? (
              <Box
                component="img"
                src={img[k]}
                alt={`xray ${k}`}
                sx={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: 220,
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            ) : (
              <Box
                sx={{
                  height: 220,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.6,
                  border: '1px dashed rgba(0,0,0,.12)',
                  borderRadius: 1,
                }}
              >
                <Typography variant="caption">No image</Typography>
              </Box>
            )}
          </Grid>
        ))}
      </Grid>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="left">Age of {item.age1}</TableCell>
              <TableCell align="center">Parameter</TableCell>
              <TableCell align="right">Age of {item.age2}</TableCell>
              {item.age3 != null && <TableCell align="right">Age of {item.age3}</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {item.parameters?.map((p, i) => {
              const pv = item.parametersValues?.[i];
              return (
                <TableRow key={p.id}>
                  <TableCell align="left">{pv?.value1 ?? '—'}</TableCell>
                  <TableCell align="center">{p.name}</TableCell>
                  <TableCell align="right">{pv?.value2 ?? '—'}</TableCell>
                  {item.age3 != null && <TableCell align="right">{pv?.value3 ?? '—'}</TableCell>}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="body2" sx={{ mt: 1 }}>
        Correct answer: <strong>{item.correct ?? '—'}</strong>
      </Typography>

      {item.note && item.note.trim() !== '' && (
        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
          <Typography variant="overline" sx={{ opacity: 0.7 }}>
            My note
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {item.note}
          </Typography>
        </Paper>
      )}

      {/* Edycja notatki tylko gdy nie readOnly */}
      {!readOnly && (
        <Dialog open={noteOpen} onClose={() => setNoteOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>
            {item.note && item.note.trim() !== '' ? 'Edit note' : 'Add note'}
          </DialogTitle>
          <DialogContent>
            <TextField
              multiline
              minRows={4}
              fullWidth
              placeholder="Your note about the case…"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              inputProps={{ maxLength: 4000 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNoteOpen(false)} disabled={noteSaving}>
              Cancel
            </Button>
            <Button
              onClick={() => setNoteDraft('')}
              disabled={noteSaving}
              sx={{ mr: 'auto' }}
              color="inherit"
            >
              Clear
            </Button>
            <Button variant="contained" onClick={saveNote} disabled={noteSaving}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Paper>
  );
};

const UserStatsPage = () => {
  const statsClient = useMemo(() => new StatsClient(STATS_SERVICE_URL), []);
  const router = useRouter();

  const handleBack = React.useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/admin/stats?tab=users-stats');
    }
  }, [router]);

  const forcedUserId = React.useMemo(() => {
    const raw = router.query.userId;
    const v = Array.isArray(raw) ? raw[0] : raw;
    const num = Number(v);
    return Number.isFinite(num) ? num : undefined;
  }, [router.query.userId]);

  const [overallStats, setOverallStats] = React.useState<UserStats | null>(null);
  const [sessionStats, setSessionStats] = React.useState<QuizResults[]>([]);
  const [modeTab, setModeTab] = React.useState<QuizMode | 'all'>('all');

  const [favorites, setFavorites] = React.useState<FavoriteCase[]>([]);
  const favoritesAnchorRef = React.useRef<HTMLDivElement | null>(null);

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
        //
        console.log(e);
      }
    };
    fetchStats();
  }, [statsClient, forcedUserId]);

  React.useEffect(() => {
    const loadFavs = async () => {
      try {
        const url = forcedUserId
          ? `/api/quiz/favorites?userId=${encodeURIComponent(forcedUserId)}`
          : '/api/quiz/favorites';
        const resp = await axios.get(url, {
          headers: { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') },
        });
        setFavorites(resp.data || []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
      }
    };
    loadFavs();
  }, [forcedUserId]);

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
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
            {isAdminView && (
              <IconButton onClick={handleBack} sx={{ mr: 1 }} aria-label="Back to admin stats">
                <ArrowBackIcon color="primary" />
              </IconButton>
            )}
            <Typography variant="h4" sx={{ mr: 1 }}>
              {isAdminView ? `User ${forcedUserId} progress` : 'Your progress'}
            </Typography>
            {isAdminView && (
              <Chip
                size="small"
                label="Admin view"
                color="secondary"
                variant="outlined"
                sx={{ ml: 1 }}
              />
            )}
          </Stack>

          {favorites.length > 0 && (
            <Button
              variant="contained"
              onClick={() =>
                favoritesAnchorRef.current?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }
              sx={{ borderRadius: 999, textTransform: 'none' }}
            >
              Go to favorites
            </Button>
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

        {/* Favorites (także w admin-view, readOnly) */}
        <Box ref={favoritesAnchorRef} />
        <Typography variant="h5" sx={{ mt: 4 }}>
          Favorite cases
        </Typography>
        <Card>
          <Box sx={{ p: 2 }}>
            {favorites.length === 0 ? (
              <Typography sx={{ opacity: 0.7 }}>No favorites yet.</Typography>
            ) : (
              <Grid container spacing={2}>
                {favorites.map((f) => (
                  <Grid key={f.case_id} item xs={12} md={6}>
                    <FavoriteCaseCard
                      item={f}
                      readOnly={Boolean(isAdminView)}
                      onRemoved={(cid) =>
                        setFavorites((prev) => prev.filter((x) => x.case_id !== cid))
                      }
                      onUpdated={(u) =>
                        setFavorites((prev) => prev.map((x) => (x.case_id === u.case_id ? u : x)))
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Card>
      </Stack>
    </Box>
  );
};

export default UserStatsPage;
