import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid2,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React from 'react';
import QuizClient from '@/Clients/QuizClient';
import { IMAGES_SERVICE_URL, QUIZ_SERVICE_URL } from '@/Envs';
import InfoTip from '@/pages/quiz/_components/InfoTip';
import { QuestionData } from '@/types';
import ImagesClient from '@/Clients/ImagesClient';

type ResultDetailsModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  questionId: string;
  imagesSrc: Record<string, string>;
  answer: string;
};

const ResultDetailsModal = ({
  open,
  setOpen,
  title,
  questionId,
  imagesSrc,
  answer,
}: ResultDetailsModalProps) => {
  const quizClient = React.useMemo(() => new QuizClient(QUIZ_SERVICE_URL), []);
  const [questionDetails, setQuestionDetails] = React.useState<QuestionData>();
  const imagesClient = React.useMemo(() => new ImagesClient(IMAGES_SERVICE_URL), []);
  React.useEffect(() => {
    const fetchQuestionDetails = async () => {
      try {
        const data = await quizClient.getQuestion(questionId);
        setQuestionDetails(data);
      } catch (error) {
        console.error(error);
      }
    };
    if (questionId) {
      fetchQuestionDetails();
    }
  }, [questionId, quizClient]);
  const renderTable = () => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell align="left">Parameter</TableCell>
            <TableCell>Age of {questionDetails?.case?.age1}</TableCell>
            <TableCell>Age of {questionDetails?.case?.age2}</TableCell>
            <TableCell>Age of {questionDetails?.case?.age3}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {questionDetails?.case.parameters?.map((param, index) => (
            <TableRow key={index}>
              <TableCell component="th" scope="row" align="left">
                {param.name}
                <InfoTip
                  paramId={param.id}
                  title={param.name}
                  description={param.description}
                  referenceValues={param.referenceValues}
                  imagesClient={imagesClient}
                />
              </TableCell>
              <TableCell>{questionDetails?.case?.parametersValues[index].value1}</TableCell>

              <TableCell>{questionDetails.case.parametersValues[index].value2}</TableCell>
              <TableCell>{questionDetails.case.parametersValues[index].value3}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
  const renderImage = (path: string, alt: string) => (
    <Box>
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
    </Box>
  );
  return (
    <Dialog
      open={open}
      onClose={() => {
        setOpen(false);
      }}
      fullWidth
      maxWidth="lg"
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Paper
          sx={{ bgcolor: answer === questionDetails?.correct ? 'success.light' : 'error.light' }}
        >
          <Typography variant="body1" padding={1}>
            Your answer: {answer}
          </Typography>
          <Typography variant="body1" padding={1} mb={2}>
            Correct answer: {questionDetails?.correct}
          </Typography>
        </Paper>
        <Grid2 container direction="row" size={12} spacing={2}>
          {Object.keys(imagesSrc || {})?.map((key) => (
            <Grid2 columns={4} key={key}>
              {renderImage(key, `image ${key}`)}
            </Grid2>
          ))}
        </Grid2>
        {renderTable()}
        <Button
          onClick={() => {
            setOpen(false);
          }}
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};
export default ResultDetailsModal;
