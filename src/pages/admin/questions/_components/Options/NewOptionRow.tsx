import { IconButton, TableCell, TableRow, TextField } from '@mui/material';
import { QuestionOption } from '@/types';
import { Cancel as CancelIcon, Save as SaveIcon } from '@mui/icons-material';
import React from 'react';

type NewOptionRowProps = {
  onSave: (option: Omit<QuestionOption, 'id'>) => void;
  onCancel: () => void;
};

const NewOptionRow = ({ onSave, onCancel }: NewOptionRowProps) => {
  const [option, setOption] = React.useState<Omit<QuestionOption, 'id'>>({
    option: '',
  });
  return (
    <TableRow>
      <TableCell>
        <IconButton color="primary" onClick={() => onSave(option)} disabled={option.option === ''}>
          <SaveIcon />
        </IconButton>
        <IconButton color="error" onClick={onCancel}>
          <CancelIcon />
        </IconButton>
      </TableCell>
      <TableCell>
        <em>New</em>
      </TableCell>
      <TableCell>
        <TextField
          fullWidth
          size="small"
          value={option.option}
          onChange={(e) => {
            setOption(() => ({
              option: e.target.value,
            }));
          }}
          placeholder="Parameter name"
        />
      </TableCell>
    </TableRow>
  );
};

export default NewOptionRow;
