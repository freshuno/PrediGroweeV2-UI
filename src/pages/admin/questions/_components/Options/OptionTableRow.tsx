import { Box, IconButton, TableCell, TableRow, TextField } from '@mui/material';
import React from 'react';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

import { QuestionOption } from '@/types';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import ButtonTooltipWrapper from '@/components/ui/ButtonTooltipWrapper';
import { useAuthContext } from '@/components/contexts/AuthContext';

type ParametersTableRowProps = {
  option: QuestionOption;
  handleUpdate: (option: QuestionOption) => void;
  handleDelete: (id: string) => void;
};
const OptionTableRow = ({ option, handleUpdate, handleDelete }: ParametersTableRowProps) => {
  const [open, setOpen] = React.useState(false);
  const [updatedParameter, setUpdatedParameter] = React.useState<QuestionOption>(option);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [optionToDelete, setOptionToDelete] = React.useState<string | null>(null);
  const role = useAuthContext().userData.role;
  const canEdit = role === 'admin';

  if (!option || !option.id) return null;

  return (
    <>
      <TableRow key={option.id}>
        <TableCell>
          <ButtonTooltipWrapper tooltipText="You are not allowed to edit options" active={!canEdit}>
            <IconButton onClick={() => setOpen(!open)} disabled={!canEdit}>
              {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </ButtonTooltipWrapper>
          <ButtonTooltipWrapper tooltipText="You are not allowed to edit options" active={!canEdit}>
            <IconButton
              onClick={() => {
                setOptionToDelete(option.id.toString());
                setDeleteModalOpen(true);
              }}
              disabled={!canEdit}
            >
              <DeleteIcon color={canEdit ? 'warning' : 'disabled'} />
            </IconButton>
          </ButtonTooltipWrapper>
        </TableCell>
        <TableCell>{option.id}</TableCell>
        <TableCell>{option.option}</TableCell>
        <TableCell>{option.questions}</TableCell>
      </TableRow>
      {open && (
        <TableRow key={option.id.toString() + 'expanded'}>
          <TableCell />
          <TableCell>
            <IconButton
              onClick={() => {
                handleUpdate(updatedParameter);
                option = updatedParameter;
                setOpen(!open);
              }}
            >
              <CheckIcon color="primary" />
            </IconButton>
          </TableCell>
          <TableCell>
            <Box maxWidth="250px">
              <TextField
                name="name"
                defaultValue={option.option}
                onChange={(e) => {
                  setUpdatedParameter({ ...updatedParameter, option: e.target.value });
                }}
                fullWidth
                inputProps={{ style: { fontSize: 13 } }}
                size="small"
              />
            </Box>
          </TableCell>
          <TableCell />
        </TableRow>
      )}
      <ConfirmationModal
        open={deleteModalOpen}
        title="Delete Option"
        message={`This option is used for ${option.questions} questions. Are you sure you want to delete this option?`}
        onConfirm={() => {
          if (optionToDelete) handleDelete(optionToDelete);
          setDeleteModalOpen(false);
        }}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </>
  );
};
export default OptionTableRow;
