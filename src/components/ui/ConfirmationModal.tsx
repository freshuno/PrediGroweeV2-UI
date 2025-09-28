import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmationModal = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) => (
  <Dialog open={open} onClose={onCancel}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>{message}</DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>Cancel</Button>
      <Button onClick={onConfirm} color="error" variant="contained">
        Confirm
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmationModal;
