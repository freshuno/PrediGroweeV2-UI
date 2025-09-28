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

// Minimalny typ pytania zwracanego w wynikach
// (uwzględnia różne warianty kluczy spotykane w payloadach)
type ResultQuestion = {
  caseId?: number;
  case_id?: number;
  case?: { id?: number };
  questionId?: number;
  question_id?: number;
};

const QuizResultsPage = ({ sessionId, newQuiz }: { sessionId: string; newQuiz: () => void }) => {
  const [results, setResults] = useState<QuizResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // report dialog state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportSending, setReportSending] = useState(false);
  const [reportCaseId, setReportCaseId] = useState<number | null>(null);

  const statsClient = useMemo(() => new StatsClient(STATS_SERVICE_URL), []);

  React.useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await statsClient.getQuizResults(sessionId);
        setResults(data);
        setLoading(false);
      } catch (error) {
        setError(error as Error);
        setLoading(false);
      }
    };
    fetchResults();
  }, [sessionId, statsClient]);

  const ensureCaseId = async (question: ResultQuestion): Promise<number | null> => {
    // Spróbuj najpierw wyciągnąć z wyników (różne możliwe nazwy w payloadach)
    const fromResults = question?.caseId ?? question?.case_id ?? question?.case?.id ?? null;

    if (fromResults) return fromResults as number;

    // Fallback: dociągnij /api/quiz/q/{id} i weź case.id
    const qid = question?.questionId ?? question?.question_id;
    if (!qid) return null;

    try {
      const resp = await axios.get(`/api/quiz/q/${qid}`, {
        headers: { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') },
      });
      const id = resp?.data?.case?.id;
      return typeof id === 'number' ? id : null;
    } catch {
      return null;
    }
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
                    return (
                      <QuizResultGridItem
                        key={key}
                        question={question}
                        index={index}
                        onReport={() => openReportForQuestion(q)}
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
