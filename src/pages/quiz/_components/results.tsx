import React, { useMemo, useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid2,
  Box,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import StatsClient from '@/Clients/StatsClient';
import { STATS_SERVICE_URL } from '@/Envs';
import TopNavBar from '@/components/ui/TopNavBar/TopNavBar';
import QuizResultGridItem from '@/pages/quiz/_components/QuizResultGridItem';
import { QuizResults } from '@/types';
import axios from 'axios';

type ResultQuestion = {
  caseId?: number;
  case_id?: number;
  case?: { id?: number };
  questionId?: number | string;
  question_id?: number | string;
};

type FavoriteRow = { case_id: number };

const toNum = (v: number | string | null | undefined): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const getQuestionId = (q: ResultQuestion): number | null =>
  toNum(q?.questionId ?? q?.question_id ?? null);

const QuizResultsPage = ({ sessionId, newQuiz }: { sessionId: string; newQuiz: () => void }) => {
  const [results, setResults] = useState<QuizResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportSending, setReportSending] = useState(false);
  const [reportCaseId, setReportCaseId] = useState<number | null>(null);

  const [favoriteCaseIds, setFavoriteCaseIds] = useState<Set<number>>(new Set());
  const [resolvedCaseIds, setResolvedCaseIds] = useState<Map<number, number>>(new Map());

  const statsClient = useMemo(() => new StatsClient(STATS_SERVICE_URL), []);

  React.useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await statsClient.getQuizResults(sessionId);
        setResults(data);
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };
    fetchResults();
  }, [sessionId, statsClient]);

  React.useEffect(() => {
    const fetchFavs = async () => {
      try {
        const resp = await axios.get<FavoriteRow[]>('/api/quiz/favorites', {
          headers: { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') },
        });
        const ids = new Set<number>((resp.data ?? []).map((f) => f.case_id));
        setFavoriteCaseIds(ids);
      } catch (e) {
        console.warn('Failed to load favorites', e);
      }
    };
    fetchFavs();
  }, []);

  React.useEffect(() => {
    const resolveMissing = async () => {
      if (!results?.questions?.length) return;

      const tasks: Array<Promise<void>> = [];

      (results.questions as unknown as ResultQuestion[]).forEach((q) => {
        const hasCaseId =
          typeof (q.caseId ?? q.case_id ?? q.case?.id) === 'number' &&
          Number.isFinite(q.caseId ?? q.case_id ?? q.case?.id);
        if (hasCaseId) return;

        const qid = getQuestionId(q);
        if (!qid || resolvedCaseIds.has(qid)) return;

        tasks.push(
          (async () => {
            try {
              const resp = await axios.get(`/api/quiz/q/${qid}`, {
                headers: { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') },
              });
              const cid = resp?.data?.case?.id;
              if (typeof cid === 'number') {
                setResolvedCaseIds((prev) => {
                  const next = new Map(prev);
                  next.set(qid, cid);
                  return next;
                });
              }
            } catch {
              // noop
            }
          })()
        );
      });

      if (tasks.length) {
        await Promise.allSettled(tasks);
      }
    };

    resolveMissing();
  }, [results, resolvedCaseIds]);

  const ensureCaseId = async (question: ResultQuestion): Promise<number | null> => {
    const inline =
      question?.caseId ??
      question?.case_id ??
      (typeof question?.case?.id === 'number' ? question.case.id : null) ??
      null;

    if (typeof inline === 'number') return inline;

    const qid = getQuestionId(question);
    if (!qid) return null;

    const cached = resolvedCaseIds.get(qid);
    if (typeof cached === 'number') return cached;

    try {
      const resp = await axios.get(`/api/quiz/q/${qid}`, {
        headers: { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') },
      });
      const id = resp?.data?.case?.id;
      if (typeof id === 'number') {
        setResolvedCaseIds((prev) => {
          const next = new Map(prev);
          next.set(qid, id);
          return next;
        });
        return id;
      }
    } catch {
      /* noop */
    }
    return null;
  };

  const openReportForQuestion = async (question: ResultQuestion) => {
    const caseId = await ensureCaseId(question);
    if (!caseId) {
      alert('Cannot find case ID for this question.');
      return;
    }
    setReportCaseId(caseId);
    setReportText('');
    setReportOpen(true);
  };

  const toggleFavorite = async (question: ResultQuestion) => {
    const cid = await ensureCaseId(question);
    if (!cid) {
      alert('Cannot find case ID for this question.');
      return;
    }
    try {
      const isFav = favoriteCaseIds.has(cid);
      if (isFav) {
        await axios.delete(`/api/quiz/cases/${cid}/favorite`, {
          headers: { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') },
        });
        setFavoriteCaseIds((prev) => {
          const next = new Set(prev);
          next.delete(cid);
          return next;
        });
      } else {
        await axios.post(
          `/api/quiz/cases/${cid}/favorite`,
          {},
          { headers: { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') } }
        );
        setFavoriteCaseIds((prev) => {
          const next = new Set(prev);
          next.add(cid);
          return next;
        });
      }
    } catch (e) {
      console.error(e);
      alert('Failed to update favorites.');
    }
  };

  const submitReport = async () => {
    if (!reportCaseId) return;
    const text = reportText.trim();
    if (!text) return;

    try {
      setReportSending(true);
      await axios.post(
        `/api/quiz/cases/${reportCaseId}/report`,
        { description: text },
        { headers: { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') } }
      );
      setReportOpen(false);
      setReportText('');
      alert('Thank you! Your report has been sent.');
    } catch (e) {
      console.error(e);
      alert('Failed to send the report.');
    } finally {
      setReportSending(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">Error loading results. Please try again later.</Alert>
      </Box>
    );
  }

  if (!results) return null;

  const percentageScore = (results.accuracy * 100).toFixed(1);

  return (
    <>
      <TopNavBar />
      <Box maxWidth="lg" mx="auto" p={3}>
        <Grid2 container spacing={3}>
          {/* Summary Card */}
          <Grid2 size={12}>
            <Card>
              <CardHeader title="Quiz Results Summary" sx={{ textAlign: 'center' }} />
              <CardContent>
                <Grid2 container spacing={3}>
                  <Grid2 size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                      <Typography color="text.secondary" gutterBottom>
                        Mode
                      </Typography>
                      <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                        {results.mode}
                      </Typography>
                    </Paper>
                  </Grid2>
                  <Grid2 size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                      <Typography color="text.secondary" gutterBottom>
                        Score
                      </Typography>
                      <Typography variant="h6">
                        {results.correctAnswers} / {results.totalQuestions}
                      </Typography>
                    </Paper>
                  </Grid2>
                  <Grid2 size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                      <Typography color="text.secondary" gutterBottom>
                        Accuracy
                      </Typography>
                      <Typography variant="h6">{percentageScore}%</Typography>
                    </Paper>
                  </Grid2>
                </Grid2>
                <Stack my={2}>
                  <Button onClick={newQuiz}>Start a new quiz</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid2>

          {/* Questions List */}
          <Grid2 size={12}>
            <Card>
              <CardHeader title="Question Details" />
              <Divider />
              <CardContent>
                <Grid2 container spacing={2}>
                  {results.questions?.map((question, index) => {
                    const q = question as unknown as ResultQuestion;
                    const key = q.questionId ?? q.question_id ?? index;

                    const inlineCid =
                      q?.caseId ??
                      q?.case_id ??
                      (q?.case && typeof q.case.id === 'number' ? q.case.id : null);

                    const qidNum = getQuestionId(q);
                    const resolvedCid =
                      inlineCid != null && typeof inlineCid === 'number'
                        ? inlineCid
                        : qidNum != null
                          ? (resolvedCaseIds.get(qidNum) ?? null)
                          : null;

                    const isFav =
                      resolvedCid != null && typeof resolvedCid === 'number'
                        ? favoriteCaseIds.has(resolvedCid)
                        : false;

                    return (
                      <QuizResultGridItem
                        key={key as React.Key}
                        question={question}
                        index={index}
                        onReport={() => openReportForQuestion(q)}
                        isFavorite={isFav}
                        onToggleFavorite={() => toggleFavorite(q)}
                      />
                    );
                  })}
                </Grid2>
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>
      </Box>

      {/* Report dialog */}
      <Dialog open={reportOpen} onClose={() => setReportOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Report a problem with this question</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            minRows={4}
            fullWidth
            placeholder="Describe what is wrong (missing image, wrong parameter, typo, etc.)"
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            inputProps={{ maxLength: 4000 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportOpen(false)} disabled={reportSending}>
            Cancel
          </Button>
          <Button
            onClick={submitReport}
            variant="contained"
            disabled={reportSending || !reportText.trim()}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuizResultsPage;
