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
} from '@mui/material';
import StatsClient from '@/Clients/StatsClient';
import { STATS_SERVICE_URL } from '@/Envs';
import TopNavBar from '@/components/ui/TopNavBar/TopNavBar';
import QuizResultGridItem from '@/pages/quiz/_components/QuizResultGridItem';
import { QuizResults } from '@/types';

const QuizResultsPage = ({ sessionId, newQuiz }: { sessionId: string; newQuiz: () => void }) => {
  const [results, setResults] = useState<QuizResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
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
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        bgcolor: 'grey.50',
                      }}
                    >
                      <Typography color="text.secondary" gutterBottom>
                        Mode
                      </Typography>
                      <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                        {results.mode}
                      </Typography>
                    </Paper>
                  </Grid2>
                  <Grid2 size={{ xs: 12, md: 4 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        bgcolor: 'grey.50',
                      }}
                    >
                      <Typography color="text.secondary" gutterBottom>
                        Score
                      </Typography>
                      <Typography variant="h6">
                        {results.correctAnswers} / {results.totalQuestions}
                      </Typography>
                    </Paper>
                  </Grid2>
                  <Grid2 size={{ xs: 12, md: 4 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        bgcolor: 'grey.50',
                      }}
                    >
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
                  {results.questions?.map((question, index) => (
                    <QuizResultGridItem
                      key={question.questionId}
                      question={question}
                      index={index}
                    />
                  ))}
                </Grid2>
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>
      </Box>
    </>
  );
};

export default QuizResultsPage;
