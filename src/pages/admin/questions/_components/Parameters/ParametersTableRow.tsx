import { IconButton, TableCell, TableRow, TextField, Button, Box } from '@mui/material';
import React from 'react';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Parameter } from '@/types';
import CheckIcon from '@mui/icons-material/Check';
import Image from 'next/image';
import ImagesClient from '@/Clients/ImagesClient';
import { IMAGES_SERVICE_URL } from '@/Envs';
import ButtonTooltipWrapper from '@/components/ui/ButtonTooltipWrapper';
import { useAuthContext } from '@/components/contexts/AuthContext';

type ParametersTableRowProps = {
  parameter: Parameter;
  handleUpdate: (param: Parameter, image?: File) => void;
};

const ParametersTableRow = ({ parameter, handleUpdate }: ParametersTableRowProps) => {
  const [open, setOpen] = React.useState(false);
  const [updatedParameter, setUpdatedParameter] = React.useState<Parameter>(parameter);
  const [newImage, setNewImage] = React.useState<File | null>(null);
  const [imageUrl, setImageUrl] = React.useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imagesClient = React.useMemo(() => new ImagesClient(IMAGES_SERVICE_URL), []);
  const canEdit = useAuthContext().userData.role === 'admin';

  React.useEffect(() => {
    const loadImage = async () => {
      try {
        const blob = await imagesClient.getParamImage(parameter?.id);
        setImageUrl(URL.createObjectURL(blob));
      } catch (err) {
        console.error('Failed to load image:', err);
      }
    };
    if (open) {
      loadImage();
    }
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parameter?.id, open, imagesClient]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewImage(e.target.files[0]);
      const url = URL.createObjectURL(e.target.files[0]);
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      setImageUrl(url);
    }
  };

  if (!parameter || !parameter?.id) return null;

  return (
    <>
      <TableRow key={parameter?.id}>
        <TableCell>
          <ButtonTooltipWrapper
            tooltipText="You are not allowed to edit parameters"
            active={!canEdit}
          >
            <IconButton onClick={() => setOpen(!open)} disabled={!canEdit}>
              {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </ButtonTooltipWrapper>
        </TableCell>
        <TableCell>{parameter.id}</TableCell>
        <TableCell>{parameter.name}</TableCell>
        <TableCell>{parameter.description}</TableCell>
        <TableCell>{parameter.referenceValues}</TableCell>
        {/* <TableCell>
          {imageUrl && (
            <Image 
              src={imageUrl} 
              alt={parameter.name} 
              width={50} 
              height={50} 
              style={{ objectFit: 'contain' }}
            />
          )}
        </TableCell> */}
      </TableRow>
      {open && (
        <TableRow key={parameter?.id.toString() + 'expanded'}>
          <TableCell />
          <TableCell>
            <IconButton
              onClick={() => {
                handleUpdate(updatedParameter, newImage || undefined);
                setOpen(false);
              }}
            >
              <CheckIcon color="primary" />
            </IconButton>
          </TableCell>
          <TableCell>
            <TextField
              name="name"
              defaultValue={parameter.name}
              onChange={(e) => {
                setUpdatedParameter({ ...updatedParameter, name: e.target.value });
              }}
              fullWidth
              inputProps={{ style: { fontSize: 13 } }}
              size="small"
            />
          </TableCell>
          <TableCell>
            <TextField
              name="description"
              defaultValue={parameter.description}
              onChange={(e) => {
                setUpdatedParameter({ ...updatedParameter, description: e.target.value });
              }}
              fullWidth
              inputProps={{ style: { fontSize: 13 } }}
              size="small"
            />
          </TableCell>
          <TableCell>
            <TextField
              name="reference values"
              defaultValue={parameter.referenceValues}
              onChange={(e) => {
                setUpdatedParameter({ ...updatedParameter, referenceValues: e.target.value });
              }}
              fullWidth
              inputProps={{ style: { fontSize: 13 } }}
              size="small"
            />
          </TableCell>
          <TableCell>
            <Box>
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={parameter.name}
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
                sx={{ mt: 1 }}
                fullWidth
              >
                Replace Image
              </Button>
            </Box>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default ParametersTableRow;
