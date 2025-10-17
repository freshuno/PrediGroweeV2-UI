import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import axios from 'axios';
import { QUIZ_SERVICE_URL } from '@/Envs';
import { QuestionData } from '@/types';

type UserLike = { id: number; name?: string; email?: string } | number | null | undefined;

type TestSummary = {
  id: number;
  code: string;
  name: string;
  created_at?: string;
  createdAt?: string;
  created_by?: UserLike;
  createdBy?: UserLike;
  questions_count?: number;
  questionsCount?: number;
  question_ids?: number[];
  questionIds?: number[];
  questions?: Array<Pick<QuestionData, 'id' | 'group'>>;
};

function authHeader() {
  return { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') };
}

const TestsTable: React.FC = () => {
  const [tests, setTests] = React.useState<TestSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [openView, setOpenView] = React.useState(false);
  const [viewTest, setViewTest] = React.useState<TestSummary | null>(null);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  const [snack, setSnack] = React.useState<{
    open: boolean;
    msg: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, msg: '', severity: 'success' });

  const getCount = React.useCallback((t: TestSummary) => {
    return (
      t.questions_count ??
      t.questionsCount ??
      t.questions?.length ??
      t.question_ids?.length ??
      t.questionIds?.length ??
      0
    );
  }, []);

  const getCreatedAt = (t: TestSummary) => t.created_at ?? t.createdAt ?? '';
  const getCreatedBy = (t: TestSummary) => {
    const raw = (t.created_by ?? t.createdBy) as UserLike;
    if (!raw) return '—';
    if (typeof raw === 'number') return `User #${raw}`;
    return raw.name || raw.email || (raw.id ? `User #${raw.id}` : '—');
  };

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<TestSummary[]>(`${QUIZ_SERVICE_URL}/tests`, {
        headers: authHeader(),
      });
      const list = res.data || [];
      setTests(list);

      const missing = list.filter((t) => !getCount(t));
      if (missing.length > 0) {
        const results = await Promise.all(
          missing.map((t) =>
            axios
              .get<TestSummary>(`${QUIZ_SERVICE_URL}/tests/${t.id}`, { headers: authHeader() })
              .then((r) => ({ id: t.id, count: getCount(r.data) }))
              .catch(() => ({ id: t.id, count: 0 }))
          )
        );
        setTests((prev) =>
          prev.map((t) => {
            const hit = results.find((r) => r.id === t.id);
            return hit ? { ...t, questions_count: hit.count } : t;
          })
        );
      }
    } catch {
      setError('Failed to load tests');
    } finally {
      setLoading(false);
    }
  }, [getCount]);

  React.useEffect(() => {
    load();
  }, [load]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setSnack({ open: true, msg: 'Code copied', severity: 'info' });
    } catch {
      setSnack({ open: true, msg: 'Failed to copy', severity: 'error' });
    }
  };

  const openDetails = async (t: TestSummary) => {
    if (!t.questions && !t.question_ids && !t.questionIds) {
      try {
        const res = await axios.get<TestSummary>(`${QUIZ_SERVICE_URL}/tests/${t.id}`, {
          headers: authHeader(),
        });
        setViewTest(res.data ?? t);
      } catch {
        setViewTest(t);
      }
    } else {
      setViewTest(t);
    }
    setOpenView(true);
  };

  const deleteTest = async (id: number) => {
    setDeletingId(id);
    try {
      await axios.delete(`${QUIZ_SERVICE_URL}/tests/${id}`, { headers: authHeader() });
      setTests((prev) => prev.filter((x) => x.id !== id));
      setSnack({ open: true, msg: 'Test deleted', severity: 'success' });
    } catch {
      setSnack({ open: true, msg: 'Failed to delete test', severity: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Box p={3} textAlign="center">
        <Typography>Loading…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <>
      <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Tests</Typography>
        <Button onClick={load} variant="outlined">
          Refresh
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="right">Questions</TableCell>
              <TableCell>Created by</TableCell>
              <TableCell>Created at</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tests.map((t) => (
              <TableRow key={t.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={t.code} variant="outlined" />
                    <Tooltip title="Copy code">
                      <IconButton size="small" onClick={() => copyCode(t.code)}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
                <TableCell>{t.name}</TableCell>
                <TableCell align="right">{getCount(t)}</TableCell>
                <TableCell>{getCreatedBy(t)}</TableCell>
                <TableCell>
                  {getCreatedAt(t) ? new Date(getCreatedAt(t)!).toLocaleString() : '—'}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="View details">
                      <IconButton onClick={() => openDetails(t)}>
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete test">
                      <span>
                        <IconButton
                          onClick={() => deleteTest(t.id)}
                          disabled={deletingId === t.id}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {tests.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography align="center" color="text.secondary">
                    No tests yet.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Details */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="md">
        <DialogTitle>
          {viewTest ? `${viewTest.name} (${viewTest.code})` : 'Test details'}
        </DialogTitle>
        <DialogContent dividers>
          {viewTest ? (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Created by: {getCreatedBy(viewTest)}{' '}
                {getCreatedAt(viewTest)
                  ? `• ${new Date(getCreatedAt(viewTest)!).toLocaleString()}`
                  : ''}
              </Typography>

              <Typography variant="subtitle1">Questions</Typography>
              {viewTest.questions && viewTest.questions.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell align="right">Group</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {viewTest.questions.map((q) => (
                        <TableRow key={q.id}>
                          <TableCell>{q.id}</TableCell>
                          <TableCell align="right">{q.group ?? '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {(viewTest.question_ids ?? viewTest.questionIds ?? []).map((id) => (
                      <Chip key={id} label={`Q#${id}`} />
                    ))}
                  </Stack>
                  {getCount(viewTest) === 0 && (
                    <Typography color="text.secondary">No questions.</Typography>
                  )}
                </>
              )}
            </Stack>
          ) : (
            <Typography>Loading…</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenView(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          sx={{ width: '100%' }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default TestsTable;
