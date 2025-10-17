import TopNavBar from '@/components/ui/TopNavBar/TopNavBar';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import React from 'react';
import axios from 'axios';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuthContext } from '@/components/contexts/AuthContext';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import ButtonTooltipWrapper from '@/components/ui/ButtonTooltipWrapper';

type CaseReport = {
  id: number;
  case_id: number;
  case_code: string;
  user_id: number;
  description: string;
  created_at: string;

  admin_note?: string | null;
  admin_note_updated_at?: string | null;
  admin_note_updated_by?: number | null;
};

const ReportsPage = () => {
  const [rows, setRows] = React.useState<CaseReport[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [reportToDelete, setReportToDelete] = React.useState<number | null>(null);

  const [noteModalOpen, setNoteModalOpen] = React.useState(false);
  const [noteDraft, setNoteDraft] = React.useState('');
  const [noteTargetId, setNoteTargetId] = React.useState<number | null>(null);
  const [noteSaving, setNoteSaving] = React.useState(false);

  const canEdit = useAuthContext().userData.role === 'admin';

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await axios.get<CaseReport[]>('/api/quiz/reports');
      setRows(resp.data);
    } catch (e) {
      console.error(e);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const deleteReport = async (id: number) => {
    try {
      await axios.delete(`/api/quiz/reports/${id}`);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error(e);
      setError('Failed to delete report');
    }
  };

  const openEditNote = (r: CaseReport) => {
    setNoteTargetId(r.id);
    setNoteDraft(r.admin_note ?? '');
    setNoteModalOpen(true);
  };

  const saveNote = async () => {
    if (noteTargetId == null) return;
    try {
      setNoteSaving(true);
      await axios.put(`/api/quiz/reports/${noteTargetId}/note`, { note: noteDraft });
      setRows((prev) =>
        prev.map((r) =>
          r.id === noteTargetId
            ? {
                ...r,
                admin_note: noteDraft.trim(),
                admin_note_updated_at: new Date().toISOString(),
              }
            : r
        )
      );
      setNoteModalOpen(false);
    } catch (e) {
      console.error(e);
      setError('Failed to save note');
    } finally {
      setNoteSaving(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <TopNavBar />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Loading...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <TopNavBar />
      <Box py={3} maxWidth="lg" mx="auto" px={{ md: 2, xs: 1 }}>
        <Typography variant="h4" gutterBottom>
          <IconButton LinkComponent={Link} href="/admin" sx={{ mr: 2 }}>
            <ArrowBackIcon color="primary" />
          </IconButton>
          Bug Reports
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Card>
          <CardHeader title="Reports list" />
          <CardContent>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={160}>Created</TableCell>
                    <TableCell width={200}>Case</TableCell>
                    <TableCell width={100}>User ID</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell width={260}>Note</TableCell>
                    <TableCell width={120} align="center">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        {r.case_code} (#{r.case_id})
                      </TableCell>
                      <TableCell>{r.user_id}</TableCell>
                      <TableCell style={{ whiteSpace: 'pre-wrap' }}>{r.description}</TableCell>
                      <TableCell sx={{ whiteSpace: 'pre-wrap' }}>
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          gap={1}
                        >
                          <Typography variant="body2" sx={{ opacity: r.admin_note ? 1 : 0.6 }}>
                            {r.admin_note && r.admin_note.trim() !== ''
                              ? r.admin_note
                              : '— no note —'}
                          </Typography>
                          <ButtonTooltipWrapper
                            tooltipText="Only admins can edit notes"
                            active={!canEdit}
                          >
                            <span>
                              <Button
                                variant="text"
                                size="small"
                                onClick={() => openEditNote(r)}
                                disabled={!canEdit}
                              >
                                {r.admin_note && r.admin_note.trim() !== '' ? 'Edit' : 'Add'}
                              </Button>
                            </span>
                          </ButtonTooltipWrapper>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <ButtonTooltipWrapper
                          tooltipText="Only admins can delete"
                          active={!canEdit}
                        >
                          <span>
                            <IconButton
                              aria-label="delete report"
                              onClick={() => {
                                setReportToDelete(r.id);
                                setDeleteModalOpen(true);
                              }}
                              disabled={!canEdit}
                            >
                              <DeleteIcon color={canEdit ? 'warning' : 'disabled'} />
                            </IconButton>
                          </span>
                        </ButtonTooltipWrapper>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No reports
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <ConfirmationModal
          open={deleteModalOpen}
          title="Delete report"
          message="Are you sure you want to delete this report?"
          onConfirm={() => {
            if (reportToDelete !== null) deleteReport(reportToDelete);
            setDeleteModalOpen(false);
          }}
          onCancel={() => setDeleteModalOpen(false)}
        />

        {/* Dialog: add/edit note */}
        <Dialog
          open={noteModalOpen}
          onClose={() => setNoteModalOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            {(rows.find((r) => r.id === noteTargetId)?.admin_note ? 'Edit' : 'Add') + ' note'}
          </DialogTitle>
          <DialogContent>
            <TextField
              multiline
              minRows={4}
              fullWidth
              placeholder="Internal note for admins..."
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              inputProps={{ maxLength: 4000 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNoteModalOpen(false)} disabled={noteSaving}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setNoteDraft('');
              }}
              disabled={noteSaving}
            >
              Clear
            </Button>
            <Button onClick={saveNote} variant="contained" disabled={noteSaving}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default ReportsPage;
