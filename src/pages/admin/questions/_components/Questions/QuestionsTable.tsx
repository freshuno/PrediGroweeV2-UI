import React from 'react';
import {
  Box,
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
  Stack,
  Alert,
  Checkbox,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import { QuestionDetailsModal } from '@/components/ui/QuestionDetailsModal/QuestionDetailsModal';
import { QuestionData } from '@/types';
import AdminClient from '@/Clients/AdminClient';
import { ADMIN_SERVICE_URL, QUIZ_SERVICE_URL } from '@/Envs';
import axios from 'axios';

type DiffInfo = { hard_pct: number; total_votes: number };

const AdminQuestionsPanel = () => {
  const [questions, setQuestions] = React.useState<QuestionData[]>([]);
  const [selectedQuestion, setSelectedQuestion] = React.useState<QuestionData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // selection + dialog state
  const [selected, setSelected] = React.useState<number[]>([]);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [testName, setTestName] = React.useState('');
  const [testCode, setTestCode] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [snack, setSnack] = React.useState<{
    open: boolean;
    msg: string;
    severity: 'success' | 'error';
  }>({ open: false, msg: '', severity: 'success' });

  // difficulty map per question id
  const [diffMap, setDiffMap] = React.useState<Record<number, DiffInfo>>({});

  const adminClient = React.useMemo(() => new AdminClient(ADMIN_SERVICE_URL), []);

  React.useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await adminClient.getAllQuestions();
        setQuestions(data);
      } catch {
        setError('Failed to load questions');
      } finally {
        setIsLoading(false);
      }
    };
    loadQuestions();
  }, [adminClient]);

  // fetch difficulty summaries for all questions (BATCH)
  React.useEffect(() => {
    if (!questions.length) return;

    const token = sessionStorage.getItem('accessToken') || '';
    const ids = questions.map((q) => q.id);
    const url = `${QUIZ_SERVICE_URL}/questions/difficulty/summary?ids=${ids.join(',')}`;

    axios
      .get(url, { headers: { Authorization: 'Bearer ' + token } })
      .then((res) => {
        const arr = Array.isArray(res.data) ? res.data : [];
        const m: Record<number, DiffInfo> = {};
        for (const row of arr) {
          const qid = Number(row?.question_id);
          if (!Number.isFinite(qid)) continue;
          m[qid] = {
            hard_pct: Number(row?.hard_pct ?? 0),
            total_votes: Number(row?.total_votes ?? 0),
          };
        }
        for (const id of ids) {
          if (!m[id]) m[id] = { hard_pct: 0, total_votes: 0 };
        }
        setDiffMap(m);
      })
      .catch(() => {
        const m: Record<number, DiffInfo> = {};
        for (const id of ids) m[id] = { hard_pct: 0, total_votes: 0 };
        setDiffMap(m);
      });
  }, [questions]);

  const toggle = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const allIds = React.useMemo(() => questions.map((q) => q.id), [questions]);
  const allSelected = selected.length > 0 && selected.length === questions.length;
  const someSelected = selected.length > 0 && selected.length < questions.length;

  const toggleAll = () => {
    if (allSelected) setSelected([]);
    else setSelected(allIds);
  };

  const handleCreate = async () => {
    const code = testCode.trim().toUpperCase();
    const name = testName.trim();

    if (!name) {
      setSnack({ open: true, msg: 'Name is required', severity: 'error' });
      return;
    }
    if (!/^[A-Z0-9-]{4,24}$/.test(code)) {
      setSnack({
        open: true,
        msg: 'Code must be 4–24 chars: A–Z, 0–9, dash',
        severity: 'error',
      });
      return;
    }
    if (selected.length === 0) {
      setSnack({ open: true, msg: 'Select at least one question', severity: 'error' });
      return;
    }

    setCreating(true);
    try {
      await axios.post(
        `${QUIZ_SERVICE_URL}/tests`,
        { code, name, question_ids: selected },
        { headers: { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') } }
      );
      setSnack({ open: true, msg: 'Test created', severity: 'success' });
      setSelected([]);
      setCreateOpen(false);
      setTestName('');
      setTestCode('');
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        if (e.response?.status === 409) {
          setSnack({ open: true, msg: 'Test code already exists', severity: 'error' });
        } else if (typeof e.response?.data === 'string') {
          setSnack({ open: true, msg: e.response.data, severity: 'error' });
        } else {
          setSnack({ open: true, msg: 'Failed to create test', severity: 'error' });
        }
      } else {
        setSnack({ open: true, msg: 'Failed to create test', severity: 'error' });
      }
    } finally {
      setCreating(false);
    }
  };

  const theme = useTheme();
  const errorBg = alpha(theme.palette.error.main, 0.12);
  const warningBg = alpha(theme.palette.warning.main, 0.16);

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
    <>
      {/* toolbar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Questions</Typography>
        <Button
          variant="contained"
          disabled={selected.length === 0}
          onClick={() => setCreateOpen(true)}
        >
          Create test from selected ({selected.length})
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {/* master checkbox */}
              <TableCell padding="checkbox">
                <Checkbox indeterminate={someSelected} checked={allSelected} onChange={toggleAll} />
              </TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Case Code</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Ages</TableCell>
              <TableCell>Group</TableCell>
              <TableCell>Correct Answer</TableCell>
              {/* difficulty column */}
              <TableCell>Difficulty</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {questions.map((question) => {
              const diff = diffMap[question.id];
              const votes = diff?.total_votes ?? 0;
              const pct = diff ? Math.round(diff.hard_pct) : 0;

              const highlight =
                votes >= 5 ? (pct >= 60 ? 'error' : pct >= 50 ? 'warning' : 'default') : 'default';

              const diffCellSx =
                highlight === 'error'
                  ? {
                      bgcolor: errorBg,
                      borderLeft: `3px solid ${theme.palette.error.main}`,
                      fontWeight: 600,
                      '& .MuiChip-root': {
                        bgcolor: 'error.main',
                        color: 'error.contrastText',
                      },
                    }
                  : highlight === 'warning'
                    ? {
                        bgcolor: warningBg,
                        borderLeft: `3px solid ${theme.palette.warning.main}`,
                        fontWeight: 600,
                        '& .MuiChip-root': {
                          bgcolor: 'warning.main',
                          color: 'warning.contrastText',
                        },
                      }
                    : {};

              let diffChip: React.ReactNode = <Typography color="text.secondary">…</Typography>;
              if (diff) {
                if (votes === 0) {
                  diffChip = <Chip label="No feedback" size="small" variant="outlined" />;
                } else {
                  const label = `Hard ${pct}% (${votes})`;
                  const chipColor: 'default' | 'error' | 'warning' =
                    highlight === 'error'
                      ? 'error'
                      : highlight === 'warning'
                        ? 'warning'
                        : 'default';
                  diffChip = <Chip label={label} size="small" color={chipColor} />;
                }
              }

              return (
                <TableRow key={question.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(question.id)}
                      onChange={() => toggle(question.id)}
                    />
                  </TableCell>
                  <TableCell>{question.id}</TableCell>
                  <TableCell>{question.case.code}</TableCell>
                  <TableCell>{question.case.gender}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Chip label={`Age 1: ${question.case.age1}`} size="small" />
                      <Chip label={`Age 2: ${question.case.age2}`} size="small" />
                      <Chip label={`Age 3: ${question.case.age3}`} size="small" />
                    </Stack>
                  </TableCell>
                  <TableCell>{question.group}</TableCell>
                  <TableCell>
                    <Chip label={question.correct} color="primary" variant="outlined" />
                  </TableCell>

                  {/* difficulty cell with strong highlight */}
                  <TableCell sx={diffCellSx}>{diffChip}</TableCell>

                  <TableCell>
                    <IconButton
                      onClick={async () =>
                        setSelectedQuestion(
                          await adminClient.getQuestionById(question.id.toString())
                        )
                      }
                    >
                      <InfoIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <QuestionDetailsModal
        key={selectedQuestion?.id ?? 'none'}
        open={!!selectedQuestion}
        onClose={() => setSelectedQuestion(null)}
        question={selectedQuestion}
        defaultImagesExpanded
        onUpdate={async (updated) => {
          await adminClient.updateQuestion(updated.id.toString(), updated);
          setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
        }}
        fetchStats={async () => {
          return adminClient.getQuestionStats(selectedQuestion?.id || 0);
        }}
      />

      {/* create test dialog */}
      <Dialog
        open={createOpen}
        onClose={() => !creating && setCreateOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Create test</DialogTitle>
        <DialogContent>
          <Box mt={1} display="grid" gap={2}>
            <TextField
              label="Name"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              fullWidth
              inputProps={{ maxLength: 80 }}
            />
            <TextField
              label="Code (A–Z, 0–9, -; 4–24)"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value.toUpperCase())}
              fullWidth
              inputProps={{ maxLength: 24 }}
            />
            <Typography variant="body2" color="text.secondary">
              Selected questions: {selected.length}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} variant="contained" disabled={creating}>
            {creating ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
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

export default AdminQuestionsPanel;
