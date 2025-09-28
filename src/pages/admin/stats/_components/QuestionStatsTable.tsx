// QuestionStatsTable.tsx
import React from 'react';
import { QuestionData, QuestionStats } from '@/types';
import AdminClient from '@/Clients/AdminClient';
import { ADMIN_SERVICE_URL } from '@/Envs';
import {
  Alert,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import StatsTableRow from './StatsTableRow';

const QuestionStatsTable = () => {
  const [stats, setStats] = React.useState<QuestionStats[]>([]);
  const [questions, setQuestions] = React.useState<QuestionData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sortField, setSortField] = React.useState<'total' | 'correct' | 'accuracy' | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');

  const adminClient = React.useMemo(() => new AdminClient(ADMIN_SERVICE_URL), []);

  const handleSort = (field: 'total' | 'correct' | 'accuracy') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedStats = React.useMemo(() => {
    if (!sortField) return stats;

    return [...stats].sort((a, b) => {
      const aValue = sortField === 'accuracy' ? a.correct / a.total : a[sortField];
      const bValue = sortField === 'accuracy' ? b.correct / b.total : b[sortField];
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [stats, sortField, sortDirection]);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, questionsData] = await Promise.all([
          adminClient.getAllQuestionStats(),
          adminClient.getAllQuestions(),
        ]);
        setStats(statsData);
        setQuestions(questionsData);
      } catch {
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [adminClient]);

  const fetchQuestion = async (questionId: string) => {
    return await adminClient.getQuestionById(questionId);
  };

  const getQuestionCode = (questionId: number) => {
    const question = questions.find((q) => q.id === questionId);
    return question?.case.code || questionId.toString();
  };

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
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Case Code</TableCell>
            <TableCell onClick={() => handleSort('total')} style={{ cursor: 'pointer' }}>
              Total answers
              {sortField === 'total' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableCell>
            <TableCell onClick={() => handleSort('correct')} style={{ cursor: 'pointer' }}>
              Correct answers {sortField === 'correct' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableCell>
            <TableCell onClick={() => handleSort('accuracy')} style={{ cursor: 'pointer' }}>
              Accuracy {sortField === 'accuracy' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedStats.map((stat, index) => (
            <StatsTableRow
              stat={stat}
              fetchQuestion={fetchQuestion}
              key={index}
              caseCode={getQuestionCode(stat.questionId)}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default QuestionStatsTable;
