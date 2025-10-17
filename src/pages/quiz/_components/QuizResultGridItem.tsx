import {
  Box,
  Button,
  Grid2,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
} from '@mui/material';
import React from 'react';
import { QuestionResult } from '@/types';
import axios from 'axios';
import ResultDetailsModal from '@/pages/quiz/_components/ResultDetailsModal';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';

type QuizResultGridItemProps = {
  question: QuestionResult;
  index: number;
  onReport?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
};

type Difficulty = 'easy' | 'hard';

const QuizResultGridItem = ({
  question,
  index,
  onReport,
  isFavorite,
  onToggleFavorite,
}: QuizResultGridItemProps) => {
  const [imageSrc, setImageSrc] = React.useState<Record<string, string>>({
    '1': '',
    '2': '',
    '3': '',
  });
  const [openDetails, setOpenDetails] = React.useState(false);

  const [reportOpen, setReportOpen] = React.useState(false);
  const [reportText, setReportText] = React.useState('');
  const [reportSending, setReportSending] = React.useState(false);
  const [reportCaseId, setReportCaseId] = React.useState<number | null>(null);

  const [difficultyOpen, setDifficultyOpen] = React.useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<Difficulty | null>(null);
  const [sendingDifficulty, setSendingDifficulty] = React.useState(false);
  const [myDifficulty, setMyDifficulty] = React.useState<Difficulty | null>(null);

  const reportInputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  React.useEffect(() => {
    if (reportOpen) {
      const id = requestAnimationFrame(() => reportInputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [reportOpen]);

  const renderImage = (path: string, alt: string) => (
    <Box>
      <Box
        component="img"
        alt={alt}
        src={imageSrc[path]}
        sx={{
          maxWidth: { xs: '100%', md: '350px' },
          width: 'auto',
          objectFit: 'scale-down',
        }}
      />
    </Box>
  );

  const getQuestionId = (q: QuestionResult | null | undefined): number | string | null => {
    if (!q) return null;
    if ('questionId' in (q as object)) {
      const val = (q as unknown as { questionId?: unknown }).questionId;
      if (typeof val === 'number' || typeof val === 'string') return val;
    }
    return null;
  };

  const readCaseIdFromQuestion = (q: QuestionResult | null | undefined): number | null => {
    if (!q) return null;
    if ('caseId' in (q as object)) {
      const v = (q as unknown as { caseId?: unknown }).caseId;
      if (typeof v === 'number') return v;
    }
    if ('case_id' in (q as object)) {
      const v = (q as unknown as { case_id?: unknown }).case_id;
      if (typeof v === 'number') return v;
    }
    if ('case' in (q as object)) {
      const c = (q as unknown as { case?: { id?: unknown } | null }).case;
      const id = c?.id;
      if (typeof id === 'number') return id;
    }
    return null;
  };

  const toNum = (v: number | string | null | undefined): number | null => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (typeof v === 'string') {
      const n = Number.parseInt(v, 10);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  React.useEffect(() => {
    const qid = getQuestionId(question);
    if (qid == null) return;

    const fetchImage = async (path: string) => {
      try {
        const res = await axios.get(
          'https://predigrowee.agh.edu.pl/api/images/questions/' + String(qid) + '/image/' + path,
          {
            responseType: 'blob',
            headers: { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') },
          }
        );
        const imageUrl = URL.createObjectURL(res.data);
        setImageSrc((prev) => ({ ...prev, [path]: imageUrl }));
      } catch (error) {
        console.error(error);
      }
    };

    fetchImage('1');
    fetchImage('2');
    fetchImage('3');
  }, [question]);

  const fetchCaseIdByQuestionId = async (qid: number | string): Promise<number | null> => {
    const qnum = toNum(qid);
    if (!qnum) return null;
    try {
      const resp = await axios.get(`/api/quiz/q/${qnum}`, {
        headers: { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') },
      });
      const id = resp?.data?.case?.id as unknown;
      return typeof id === 'number' ? id : null;
    } catch {
      return null;
    }
  };

  const openReportDialog = async () => {
    const qid = getQuestionId(question);
    if (qid == null) {
      alert('Cannot find question id.');
      return;
    }
    let cid = readCaseIdFromQuestion(question);
    if (!cid) cid = await fetchCaseIdByQuestionId(qid);
    if (!cid) {
      alert('Cannot find case id for this question.');
      return;
    }
    setReportCaseId(cid);
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

  const openDifficultyDialog = async () => {
    const qid = getQuestionId(question);
    const qnum = toNum(qid);
    if (!qnum) {
      alert('Cannot find question id.');
      return;
    }
    try {
      const resp = await axios.get(`/api/quiz/questions/${qnum}/difficulty/me`, {
        headers: { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') },
      });
      const diff = resp?.data?.difficulty as unknown;
      if (diff === 'easy' || diff === 'hard') {
        setMyDifficulty(diff);
        setSelectedDifficulty(diff);
      } else {
        setMyDifficulty(null);
        setSelectedDifficulty(null);
      }
    } catch {
      setMyDifficulty(null);
      setSelectedDifficulty(null);
    }
    setDifficultyOpen(true);
  };

  const submitDifficulty = async () => {
    const qid = getQuestionId(question);
    const qnum = toNum(qid);
    if (!qnum || !selectedDifficulty) return;
    if (myDifficulty) {
      alert('You have already rated this question.');
      return;
    }
    try {
      setSendingDifficulty(true);
      await axios.post(
        `/api/quiz/questions/${qnum}/difficulty`,
        { difficulty: selectedDifficulty },
        { headers: { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') } }
      );
      setMyDifficulty(selectedDifficulty);
      setDifficultyOpen(false);
      alert('Thanks for your feedback!');
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        alert('You already rated this question.');
        setMyDifficulty(selectedDifficulty);
      } else {
        alert('Failed to save your rating.');
      }
    } finally {
      setSendingDifficulty(false);
    }
  };

  const qidRaw = getQuestionId(question);
  const qidStr = qidRaw != null ? String(qidRaw) : '';
  const qidForKey = qidStr !== '' ? qidStr : `q-${index}`;

  return (
    <Grid2 size={12} key={qidForKey}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          bgcolor: question?.isCorrect ? 'success.light' : 'error.light',
          '&:hover': {
            bgcolor: question?.isCorrect ? 'success.200' : 'error.200',
          },
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Typography color="text.secondary">Question {index + 1}</Typography>
            <Typography fontWeight="medium">Your answer: {question?.answer ?? ''}</Typography>
          </Box>
        </Box>

        <Grid2 container direction="row" size={12} spacing={2}>
          {Object.keys(imageSrc).map((key) => (
            <Grid2 columns={4} key={key}>
              {renderImage(key, `Question ${index + 1} image ${key}`)}
            </Grid2>
          ))}
        </Grid2>

        <Box display="flex" gap={1} mt={1} flexWrap="wrap">
          <Button onClick={() => setOpenDetails(true)}>Show details</Button>
          <Button
            variant="text"
            onClick={() => {
              if (onReport) {
                onReport();
              } else {
                void openReportDialog();
              }
            }}
          >
            Report a problem
          </Button>
          <Button variant="text" onClick={() => void openDifficultyDialog()}>
            Rate difficulty
          </Button>

          {/* NEW: Favorites toggle */}
          {onToggleFavorite && (
            <Button
              variant="outlined"
              size="small"
              startIcon={isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
              onClick={onToggleFavorite}
              sx={{ ml: 'auto' }}
            >
              {isFavorite ? 'Remove favorite' : 'Add to favorites'}
            </Button>
          )}
        </Box>

        <ResultDetailsModal
          open={openDetails}
          setOpen={setOpenDetails}
          title={`Question ${index + 1}`}
          questionId={qidStr}
          imagesSrc={imageSrc}
          answer={question?.answer ?? ''}
        />
      </Paper>

      {/* Report fallback dialog */}
      {!onReport && (
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
              inputRef={reportInputRef}
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
      )}

      {/* Difficulty dialog */}
      <Dialog
        open={difficultyOpen}
        onClose={() => setDifficultyOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>How difficult was this case for you?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Choose one option below. You can vote only once per question.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant={selectedDifficulty === 'easy' ? 'contained' : 'outlined'}
              onClick={() => setSelectedDifficulty('easy')}
              disabled={!!myDifficulty}
            >
              Easy
            </Button>
            <Button
              variant={selectedDifficulty === 'hard' ? 'contained' : 'outlined'}
              onClick={() => setSelectedDifficulty('hard')}
              disabled={!!myDifficulty}
            >
              Hard
            </Button>
          </Stack>
          {myDifficulty && (
            <Typography mt={2} color="text.secondary">
              You already rated this question: <b>{myDifficulty}</b>.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDifficultyOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={submitDifficulty}
            disabled={!selectedDifficulty || sendingDifficulty || !!myDifficulty}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Grid2>
  );
};

export default QuizResultGridItem;
