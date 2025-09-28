import React from 'react';
import { Box, Button, IconButton } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle, Typography } from '@mui/material';
import ImagesClient from '@/Clients/ImagesClient';

type InfoTipProps = {
  paramId: number;
  title: string;
  description: string;
  referenceValues?: string;
  imagesClient: ImagesClient;
};

const InfoTip = ({ paramId, title, description, referenceValues, imagesClient }: InfoTipProps) => {
  const [open, setOpen] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState('');
  React.useEffect(() => {
    const loadImage = async () => {
      try {
        const blob = await imagesClient.getParamImage(paramId);
        setImageUrl(URL.createObjectURL(blob));
      } catch (err) {
        console.error('Failed to load image:', err);
      }
    };
    if (open) {
      loadImage();
    }
  }, [paramId, imagesClient, open]);
  return (
    <>
      <IconButton
        onClick={() => {
          setOpen(!open);
        }}
        sx={{ height: '32px', width: '32px' }}
      >
        <InfoIcon />
      </IconButton>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Box display="block">
            <Typography>{description}</Typography>
            {referenceValues && <Typography>Reference Value: {referenceValues}</Typography>}
            {imageUrl && (
              <Image
                src={imageUrl}
                alt={title}
                width={350}
                height={350}
                style={{ objectFit: 'contain' }}
              />
            )}
          </Box>
          <Button
            onClick={() => {
              setOpen(false);
            }}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InfoTip;
