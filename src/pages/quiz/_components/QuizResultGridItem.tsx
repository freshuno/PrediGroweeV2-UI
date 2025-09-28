import { Box, Button, Grid2, Paper, Typography } from '@mui/material';

import React from 'react';
import { QuestionResult } from '@/types';
import axios from 'axios';
import ResultDetailsModal from '@/pages/quiz/_components/ResultDetailsModal';

type QuizResultGridItemProps = {
  question: QuestionResult;
  index: number;
};

const QuizResultGridItem = ({ question, index }: QuizResultGridItemProps) => {
  const [imageSrc, setImageSrc] = React.useState<Record<string, string>>({
    '1': '',
    '2': '',
    '3': '',
  });
  const [openDetails, setOpenDetails] = React.useState(false);
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
  React.useEffect(() => {
    const fetchImage = async (path: string) => {
      try {
        const res = await axios.get(
          'https://predigrowee.agh.edu.pl/api/images/questions/' +
            question?.questionId +
            '/image/' +
            path,
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
    if (question) {
      fetchImage('1');
      fetchImage('2');
      fetchImage('3');
    }
  }, [question]);
  return (
    <Grid2 size={12} key={question?.questionId}>
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
            <Typography fontWeight="medium">Your answer: {question?.answer}</Typography>
          </Box>
        </Box>
        <Grid2 container direction="row" size={12} spacing={2}>
          {Object.keys(imageSrc).map((key) => (
            <Grid2 columns={4} key={key}>
              {renderImage(key, `Question ${index + 1} image ${key}`)}
            </Grid2>
          ))}
        </Grid2>
        <Button
          onClick={() => {
            setOpenDetails(true);
          }}
        >
          Show details
        </Button>
        <ResultDetailsModal
          open={openDetails}
          setOpen={setOpenDetails}
          title={`Question ${index + 1}`}
          questionId={question?.questionId}
          imagesSrc={imageSrc}
          answer={question?.answer}
        />
      </Paper>
    </Grid2>
  );
};
export default QuizResultGridItem;
