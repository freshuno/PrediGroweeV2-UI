import React from 'react';
import { TableRow, TableCell, TextField, IconButton, Button, Box } from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { Parameter } from '@/types';
import Image from 'next/image';

type NewParameterRowProps = {
  onSave: (parameter: Omit<Parameter, 'id'>, image: File | null) => void;
  onCancel: () => void;
};

const initialState: Omit<Parameter, 'id'> = {
  name: '',
  description: '',
  referenceValues: '',
  order: 0,
};

const NewParameterRow: React.FC<NewParameterRowProps> = ({ onSave, onCancel }) => {
  const [parameter, setParameter] = React.useState(initialState);
  const [image, setImage] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleChange =
    (field: keyof typeof initialState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setParameter((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(URL.createObjectURL(file));
    }
  };

  React.useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const isValid = parameter.name && parameter.description && image;

  return (
    <TableRow>
      <TableCell>
        <IconButton color="primary" onClick={() => onSave(parameter, image)} disabled={!isValid}>
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
          value={parameter.name}
          onChange={handleChange('name')}
          placeholder="Parameter name"
        />
      </TableCell>
      <TableCell>
        <TextField
          fullWidth
          size="small"
          value={parameter.description}
          onChange={handleChange('description')}
          placeholder="Parameter description"
        />
      </TableCell>
      <TableCell>
        <TextField
          fullWidth
          size="small"
          value={parameter.referenceValues}
          onChange={handleChange('referenceValues')}
          placeholder="Reference value"
        />
      </TableCell>
      <TableCell>
        <Box>
          {imagePreview && (
            <Image
              src={imagePreview}
              alt="Preview"
              width={200}
              height={200}
              style={{ objectFit: 'contain' }}
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
            ref={fileInputRef}
          />
          <Button
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
            size="small"
            fullWidth
            sx={{ mt: 1 }}
          >
            {image ? 'Change Image' : 'Upload Image'}
          </Button>
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default NewParameterRow;
