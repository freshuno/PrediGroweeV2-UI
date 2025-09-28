import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Grid2,
  IconButton,
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
import { ADMIN_SERVICE_URL } from '@/Envs';
import { useAuthContext } from '@/components/contexts/AuthContext';
import ButtonTooltipWrapper from '../ButtonTooltipWrapper';

type QuestionDetailsDialogProps = {
  open: boolean;
  onClose: () => void;
  question: QuestionData | null;
  fetchStats?: () => Promise<QuestionStats>;
  onUpdate?: (updatedQuestion: QuestionData) => Promise<void>;
  editable?: boolean;
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
}) => {
  const canEdit = useAuthContext().userData.role === 'admin';
  const adminClient = React.useMemo(() => new AdminClient(ADMIN_SERVICE_URL), []);
  const [stats, setStats] = React.useState<QuestionStats | null>(null);
  const [editMode, setEditMode] = React.useState(false);
  const [editedQuestion, setEditedQuestion] = React.useState<QuestionData | null>(null);
  const [imagesSrc, setImagesSrc] = React.useState<Record<string, string>>({
    '1': '',
    '2': '',
    '3': '',
  });
  const [showImages, setShowImages] = React.useState(false);

  React.useEffect(() => {
    if (question && fetchStats) {
      fetchStats().then(setStats).catch(console.error);
    }
  }, [question, fetchStats]);

  React.useEffect(() => {
    setEditedQuestion(question);
  }, [question]);

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

  const handleFetchImage = async (path: string) => {
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

  const renderImage = (path: string, alt: string) => (
    <Box
      component="img"
      alt={alt}
      src={imagesSrc[path]}
      sx={{
        maxWidth: { xs: '100%', md: '350px' },
        width: 'auto',
        objectFit: 'scale-down',
      }}
    />
  );

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
                <IconButton
                  onClick={() => {
                    setEditMode(true);
                  }}
                  disabled={!canEdit}
                >
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
                      SelectProps={{
                        native: true,
                      }}
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

          <Box>
            <Typography variant="h6" gutterBottom>
              Images
              <IconButton
                onClick={() => {
                  setShowImages(!showImages);
                  if (!showImages) {
                    ['1', '2', '3'].forEach(handleFetchImage);
                  }
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
