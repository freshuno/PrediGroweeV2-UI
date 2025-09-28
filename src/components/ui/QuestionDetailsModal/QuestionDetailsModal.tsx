import React from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Grid2,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { QuestionData, QuestionStats } from '@/types';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { ArrowDownward, ArrowUpward } from '@mui/icons-material';
import axios from 'axios';
import ParametersEditor from './ParametersEditor';
import AdminClient from '@/Clients/AdminClient';
import { ADMIN_SERVICE_URL, QUIZ_SERVICE_URL } from '@/Envs';
import { useAuthContext } from '@/components/contexts/AuthContext';
import ButtonTooltipWrapper from '../ButtonTooltipWrapper';

type QuestionDetailsDialogProps = {
  open: boolean;
  onClose: () => void;
  question: QuestionData | null;
  fetchStats?: () => Promise<QuestionStats>;
  onUpdate?: (updatedQuestion: QuestionData) => Promise<void>;
  editable?: boolean;

  defaultImagesExpanded?: boolean;
};

type DifficultySummary = {
  question_id: number;
  total_votes: number;
  hard_votes: number;
  easy_votes: number;
  hard_pct: number; // 0..100
};

const validateNumber = (value: string): number => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

export const QuestionDetailsModal: React.FC<QuestionDetailsDialogProps> = ({
  open,
  onClose,
  question,
  fetchStats,
  onUpdate,
  editable = true,
  defaultImagesExpanded = false,
}) => {
  const canEdit = useAuthContext().userData.role === 'admin';
  const adminClient = React.useMemo(() => new AdminClient(ADMIN_SERVICE_URL), []);
  const [stats, setStats] = React.useState<QuestionStats | null>(null);
  const [editMode, setEditMode] = React.useState(false);
  const [editedQuestion, setEditedQuestion] = React.useState<QuestionData | null>(null);

  // images
  const [imagesSrc, setImagesSrc] = React.useState<Record<string, string>>({
    '1': '',
    '2': '',
    '3': '',
  });
  const [showImages, setShowImages] = React.useState(false);

  // difficulty summary
  const [diff, setDiff] = React.useState<DifficultySummary | null>(null);
  const [diffLoading, setDiffLoading] = React.useState(false);
  const [diffError, setDiffError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (question && fetchStats) {
      fetchStats().then(setStats).catch(console.error);
    }
  }, [question, fetchStats]);

  React.useEffect(() => {
    setEditedQuestion(question);
  }, [question]);

  // --- images helpers
  const fetchImageFor = React.useCallback(async (questionId: number, path: string) => {
    try {
      const res = await axios.get(
        `https://predigrowee.agh.edu.pl/api/images/questions/${questionId}/image/${path}`,
        {
          responseType: 'blob',
          headers: { Authorization: `Bearer ${sessionStorage.getItem('accessToken')}` },
        }
      );
      const imageUrl = URL.createObjectURL(res.data);
      setImagesSrc((prev) => ({ ...prev, [path]: imageUrl }));
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleFetchImage = async (path: string) => {
    if (!editedQuestion) return;
    try {
      const res = await axios.get(
        `https://predigrowee.agh.edu.pl/api/images/questions/${editedQuestion.id}/image/${path}`,
        {
          responseType: 'blob',
          headers: { Authorization: `Bearer ${sessionStorage.getItem('accessToken')}` },
        }
      );
      const imageUrl = URL.createObjectURL(res.data);
      setImagesSrc((prev) => ({ ...prev, [path]: imageUrl }));
    } catch (error) {
      console.error(error);
    }
  };

  // --- difficulty summary fetch
  React.useEffect(() => {
    if (!open || !question) return;
    setDiff(null);
    setDiffError(null);
    setDiffLoading(true);
    axios
      .get(`${QUIZ_SERVICE_URL}/questions/${question.id}/difficulty/summary`, {
        headers: { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') },
      })
      .then((res) => setDiff(res.data as DifficultySummary))
      .catch(() => setDiffError('Failed to load difficulty summary'))
      .finally(() => setDiffLoading(false));
  }, [open, question?.id]);

  // --- images on open
  React.useEffect(() => {
    if (!open || !question) return;

    setImagesSrc({ '1': '', '2': '', '3': '' });

    if (defaultImagesExpanded) {
      setShowImages(true);
      ['1', '2', '3'].forEach((p) => {
        fetchImageFor(question.id, p);
      });
    } else {
      setShowImages(false);
    }
  }, [open, question?.id, defaultImagesExpanded, fetchImageFor]);

  if (!question || !editedQuestion) return null;

  const handleSave = async () => {
    try {
      if (onUpdate && editedQuestion) {
        await onUpdate(editedQuestion);
        setEditMode(false);
      }
    } catch (error) {
      console.error('Failed to update question:', error);
    }
  };

  const handleCancel = () => {
    setEditedQuestion(question);
    setEditMode(false);
  };

  const renderImage = (path: string, alt: string) => (
    <Box
      component="img"
      alt={alt}
      src={imagesSrc[path]}
      sx={{ maxWidth: { xs: '100%', md: '350px' }, width: 'auto', objectFit: 'scale-down' }}
    />
  );

  const hardPct = Math.max(0, Math.min(100, diff?.hard_pct ?? 0));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Question Details
        {editable && (
          <Box sx={{ float: 'right' }}>
            {!editMode ? (
              <ButtonTooltipWrapper
                tooltipText="You are not allowed to edit questions"
                active={!canEdit}
              >
                <IconButton onClick={() => setEditMode(true)} disabled={!canEdit}>
                  <EditIcon />
                </IconButton>
              </ButtonTooltipWrapper>
            ) : (
              <>
                <IconButton onClick={handleSave} color="primary">
                  <SaveIcon />
                </IconButton>
                <IconButton onClick={handleCancel} color="error">
                  <CancelIcon />
                </IconButton>
              </>
            )}
          </Box>
        )}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          {/* Basic info */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    ID
                  </Typography>
                  <Typography>{editedQuestion.id}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Group
                  </Typography>
                  {editMode ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={editedQuestion.group ?? ''}
                      onChange={(e) =>
                        setEditedQuestion(
                          (prev) =>
                            prev && {
                              ...prev,
                              group: validateNumber(e.target.value),
                            }
                        )
                      }
                      type="number"
                    />
                  ) : (
                    <Typography>{editedQuestion.group}</Typography>
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Correct Answer
                  </Typography>
                  {editMode ? (
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={editedQuestion.correct}
                      onChange={(e) =>
                        setEditedQuestion(
                          (prev) =>
                            prev && {
                              ...prev,
                              correct: e.target.value,
                            }
                        )
                      }
                      SelectProps={{ native: true }}
                    >
                      {editedQuestion.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </TextField>
                  ) : (
                    <Typography>{editedQuestion.correct}</Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Images */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Images
              <IconButton
                onClick={() => {
                  const next = !showImages;
                  setShowImages(next);
                  if (next) ['1', '2', '3'].forEach(handleFetchImage);
                }}
              >
                {showImages ? <ArrowUpward /> : <ArrowDownward />}
              </IconButton>
            </Typography>
            {showImages && (
              <Grid2 container direction="row" size={12} spacing={2}>
                {Object.keys(imagesSrc).map((key) => (
                  <Grid2 columns={4} key={key}>
                    {renderImage(key, `image ${key}`)}
                  </Grid2>
                ))}
              </Grid2>
            )}
          </Box>

          {/* Case info */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Case Information <strong>{editedQuestion.case.code}</strong>
            </Typography>
            <ParametersEditor
              editMode={editMode}
              question={editedQuestion}
              onChange={setEditedQuestion}
              adminClient={adminClient}
            />
          </Box>

          {/* Question stats */}
          {stats && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Question Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Attempts
                    </Typography>
                    <Typography>{stats.total}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Success Rate
                    </Typography>
                    <Typography>
                      {((stats.correct / stats.total) * 100).toFixed(1)}% ({stats.correct}/
                      {stats.total})
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Difficulty feedback */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Difficulty feedback
            </Typography>
            <Paper sx={{ p: 2 }}>
              {diffLoading && <Typography>Loading…</Typography>}
              {diffError && (
                <Typography color="error" sx={{ mb: 1 }}>
                  {diffError}
                </Typography>
              )}
              {diff && (
                <>
                  <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
                    <Chip label={`Hard: ${diff.hard_votes}`} variant="outlined" />
                    <Chip label={`Easy: ${diff.easy_votes}`} variant="outlined" />
                    <Chip label={`Total: ${diff.total_votes}`} variant="outlined" />
                    <Chip label={`Hard ratio: ${hardPct.toFixed(2)}%`} variant="outlined" />
                  </Stack>
                  <Box sx={{ display: 'grid', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Hard percentage
                    </Typography>
                    <LinearProgress variant="determinate" value={hardPct} />
                  </Box>
                </>
              )}
              {!diffLoading && !diffError && diff?.total_votes === 0 && (
                <Typography color="text.secondary">No feedback yet.</Typography>
              )}
            </Paper>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            handleCancel();
            onClose();
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuestionDetailsModal;
