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
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { QuestionDetailsModal } from '@/components/ui/QuestionDetailsModal/QuestionDetailsModal';
import { QuestionData } from '@/types';
import AdminClient from '@/Clients/AdminClient';
import { ADMIN_SERVICE_URL } from '@/Envs';

const AdminQuestionsPanel = () => {
  const [questions, setQuestions] = React.useState<QuestionData[]>([]);
  const [selectedQuestion, setSelectedQuestion] = React.useState<QuestionData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Case Code</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Ages</TableCell>
              <TableCell>Group</TableCell>
              <TableCell>Correct Answer</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {questions.map((question) => (
              <TableRow key={question.id}>
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
                <TableCell>
                  <IconButton
                    onClick={async () =>
                      setSelectedQuestion(await adminClient.getQuestionById(question.id.toString()))
                    }
                  >
                    <InfoIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <QuestionDetailsModal
        open={!!selectedQuestion}
        onClose={() => setSelectedQuestion(null)}
        question={selectedQuestion}
        onUpdate={async (updated) => {
          await adminClient.updateQuestion(updated.id.toString(), updated);
          setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
        }}
        fetchStats={async () => {
          return adminClient.getQuestionStats(selectedQuestion?.id || 0);
        }}
      />
    </>
  );
};

export default AdminQuestionsPanel;
