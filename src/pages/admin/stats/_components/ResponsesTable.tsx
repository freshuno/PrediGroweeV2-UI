import React from 'react';
import { QuestionData, ResponseData, UserDetails, UserSurvey } from '@/types';
import AdminClient from '@/Clients/AdminClient';
import { ADMIN_SERVICE_URL } from '@/Envs';
import {
  Alert,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  TextField,
  IconButton,
} from '@mui/material';
import { QuestionDetailsModal } from '@/components/ui/QuestionDetailsModal/QuestionDetailsModal';
import UserDetailsModal from '@/components/ui/UserDetailsModal/UserDetailsModal';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

const AdminResponsesPanel = () => {
  const [responses, setResponses] = React.useState<ResponseData[]>([]);
  const [surveys, setSurveys] = React.useState<UserSurvey[]>([]);
  const [filteredResponses, setFilteredResponses] = React.useState<ResponseData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [responseToDelete, setResponseToDelete] = React.useState<number | null>(null);
  const [dateRange, setDateRange] = React.useState({
    from: '',
    to: '',
  });

  const [selectedQuestion, setSelectedQuestion] = React.useState<QuestionData | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = React.useState<UserDetails | null>(null);

  const adminClient = React.useMemo(() => new AdminClient(ADMIN_SERVICE_URL), []);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [responsesData, surveysData] = await Promise.all([
          adminClient.getAllResponses(),
          adminClient.getAllSurveyResponses(),
        ]);
        setResponses(responsesData);
        setFilteredResponses(responsesData);
        setSurveys(surveysData);
      } catch {
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [adminClient]);

  React.useEffect(() => {
    if (!dateRange.from && !dateRange.to) {
      setFilteredResponses(responses);
      return;
    }

    const fromDate = dateRange.from ? new Date(dateRange.from) : new Date(0);
    const toDate = dateRange.to ? new Date(dateRange.to) : new Date();

    const filtered = responses.filter((response) => {
      const responseDate = new Date(response.time);
      return responseDate >= fromDate && responseDate <= toDate;
    });

    setFilteredResponses(filtered);
  }, [dateRange, responses]);

  const dateConverter = (date: string) => {
    const newDate = new Date(date);
    return newDate.toLocaleString();
  };

  const handleDateChange =
    (field: 'from' | 'to') => (event: React.ChangeEvent<HTMLInputElement>) => {
      setDateRange((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleDownloadCSV = () => {
    // Prepare CSV data
    const csvData = filteredResponses.map((response) => {
      const survey = surveys.find((s) => s.userId?.toString() === response.userId.toString());
      return {
        'Case ID': response.caseCode,
        'User ID': response.userId,
        Answer: response.answer,
        'Is correct': response.isCorrect ? 'Yes' : 'No',
        Time: dateConverter(response.time),
        'Screen size': response.screenSize,
        'Time spent[s]': response.timeSpent === 0 ? '<1' : response.timeSpent,
        Gender: survey?.gender || '',
        Age: survey?.age || '',
        'Vision defect': survey?.visionDefect || '',
        Education: survey?.education || '',
        Experience: survey?.experience || '',
        Country: survey?.country || '',
        Name: survey?.name || '',
        Surname: survey?.surname || '',
      };
    });

    // Convert to CSV string
    const headers = [
      'Case ID',
      'User ID',
      'Answer',
      'Is correct',
      'Time',
      'Screen size',
      'Time spent[s]',
      'Gender',
      'Age',
      'Vision defect',
      'Education',
      'Experience',
      'Country',
      'Name',
      'Surname',
    ];

    const csvString = [
      headers.join(','),
      ...csvData.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row];
            // Escape commas and quotes in values
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\n');

    // Download file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `responses_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    <>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="From Date"
            type="datetime-local"
            value={dateRange.from}
            onChange={handleDateChange('from')}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="To Date"
            type="datetime-local"
            value={dateRange.to}
            onChange={handleDateChange('to')}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <Button
            variant="outlined"
            onClick={() => setDateRange({ from: '', to: '' })}
            sx={{ minWidth: '100px' }}
          >
            Clear
          </Button>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={handleDownloadCSV}
            sx={{ minWidth: '150px' }}
          >
            Export CSV
          </Button>
        </Stack>
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          Showing {filteredResponses.length} of {responses.length} responses
        </Typography>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Case ID</TableCell>
              <TableCell>User ID</TableCell>
              <TableCell>Answer</TableCell>
              <TableCell>Is correct</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Screen size</TableCell>
              <TableCell>Time spent[s]</TableCell>
              <TableCell>Delete</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredResponses.map((res, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Button
                    onClick={async () => {
                      setSelectedQuestion(await adminClient.getQuestionById(res.questionId));
                    }}
                  >
                    {res.caseCode !== '' ? res.caseCode : res.questionId}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    onClick={async () => {
                      setSelectedUserDetails(
                        await adminClient.getUserDetails(res.userId?.toString())
                      );
                    }}
                  >
                    {res.userId}
                  </Button>
                </TableCell>
                <TableCell>{res.answer}</TableCell>
                <TableCell>{res.isCorrect ? 'Yes' : 'No'}</TableCell>
                <TableCell>{dateConverter(res.time)}</TableCell>
                <TableCell>{res.screenSize}</TableCell>
                <TableCell>{res.timeSpent === 0 ? '<1' : res.timeSpent}s</TableCell>
                <TableCell>
                  <IconButton onClick={() => setResponseToDelete(res.id)}>
                    <DeleteIcon />
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
        fetchStats={async () => {
          return adminClient.getQuestionStats(selectedQuestion?.id || 0);
        }}
        editable={false}
      />
      <UserDetailsModal
        open={!!selectedUserDetails}
        onClose={() => setSelectedUserDetails(null)}
        userDetails={selectedUserDetails}
        onRoleChange={async (id, role) => {
          try {
            await adminClient.updateUser(id.toString(), { role: role });
          } catch {
            setError('Failed to update user role');
          }
        }}
      />
      <ConfirmationModal
        title="Delete response"
        message="Are you sure you want to delete this response?"
        open={responseToDelete !== null}
        onConfirm={async () => {
          if (!responseToDelete) {
            return;
          }
          await adminClient.deleteResponse(responseToDelete?.toString());
          setResponses(responses.filter((r) => r.id !== responseToDelete));
          setResponseToDelete(null);
        }}
        onCancel={() => setResponseToDelete(null)}
      />
    </>
  );
};

export default AdminResponsesPanel;
