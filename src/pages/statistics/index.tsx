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
  Grid2,
} from '@mui/material';
import TopNavBar from '@/components/ui/TopNavBar/TopNavBar';
import StatsClient from '@/Clients/StatsClient';
import { STATS_SERVICE_URL } from '@/Envs';
import React, { useMemo } from 'react';
import { UserStats, QuizResults, QuizMode } from '@/types';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import QuizResultGridItem from '@/pages/quiz/_components/QuizResultGridItem';

const SessionRow = ({ session }: { session: QuizResults }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>{session.sessionId}</TableCell>
        <TableCell>{new Date(session.startTime).toLocaleString()}</TableCell>
        <TableCell sx={{ textTransform: 'capitalize' }}>
          {session.mode.replace(/([A-Z])/g, ' $1').trim()}
        </TableCell>
        <TableCell align="right">{session.totalQuestions}</TableCell>
        <TableCell align="right">{session.correctAnswers}</TableCell>
        <TableCell align="right">{(session.accuracy * 100).toFixed(1)}%</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Typography variant="h6" gutterBottom>
                Question Details
              </Typography>
              <Grid2 container spacing={2}>
                {session.questions?.map((question, index) => (
                  <QuizResultGridItem key={question.questionId} question={question} index={index} />
                ))}
              </Grid2>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

const UserStatsPage = () => {
  const statsClient = useMemo(() => new StatsClient(STATS_SERVICE_URL), []);
  const [overallStats, setOverallStats] = React.useState<UserStats | null>(null);
  const [sessionStats, setSessionStats] = React.useState<QuizResults[]>([]);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const [overall, sessions] = await Promise.all([
          statsClient.getUserStats(),
          statsClient.getSessionsStats(),
        ]);
        setOverallStats(overall);
        setSessionStats(sessions);
      } catch (e) {
        console.log(e);
      }
    };
    fetchStats();
  }, [statsClient]);

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
        <Typography variant="h4">User statistics</Typography>

        <Card>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mode</TableCell>
                  <TableCell align="right">Total Questions</TableCell>
                  <TableCell align="right">Correct Answers</TableCell>
                  <TableCell align="right">Accuracy</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {['classic', 'timeLimited', 'educational'].map((mode) => (
                  <TableRow key={mode}>
                    <TableCell component="th" scope="row" sx={{ textTransform: 'capitalize' }}>
                      {mode.replace(/([A-Z])/g, ' $1').trim()}
                    </TableCell>
                    <TableCell align="right">
                      {overallStats?.totalQuestions[mode as QuizMode] || 0}
                    </TableCell>
                    <TableCell align="right">
                      {overallStats?.correctAnswers[mode as QuizMode] || 0}
                    </TableCell>
                    <TableCell align="right">
                      {((overallStats?.accuracy[mode as QuizMode] || 0) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
                </TableRow>
              </TableHead>
              <TableBody>
                {sessionStats.map((session) => (
                  <SessionRow key={session.sessionId} session={session} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Stack>
    </Box>
  );
};

export default UserStatsPage;
