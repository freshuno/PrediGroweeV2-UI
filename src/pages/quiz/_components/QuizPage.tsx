import React, { useCallback, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Stack,
  Button,
  CardHeader,
  useTheme,
  Grid2,
  Box,
  LinearProgress,
} from '@mui/material';
import { useQuizContext } from '@/components/contexts/QuizContext';
import { useMediaQuery } from '@mui/system';
import { QuestionData, QuizMode } from '@/types';
import axios from 'axios';
import InfoTip from './InfoTip';
import { IMAGES_SERVICE_URL } from '@/Envs';
import ImagesClient from '@/Clients/ImagesClient';

const QUESTION_TIMEOUT = 30;

const QuizPage = ({
  nextStep,
  sessionId,
  mode,
  timeLimit,
}: {
  nextStep: () => void;
  sessionId: string;
  mode: QuizMode;
  timeLimit?: number;
}) => {
  const questionTimeout = timeLimit || QUESTION_TIMEOUT;
  const [growthDirection, setGrowthDirection] = React.useState('');
  const [questionData, setQuestionData] = React.useState<QuestionData>();
  const [questionLoading, setQuestionLoading] = React.useState(true);
  const [showCorrect, setShowCorrect] = React.useState(false);
  const [correctAnswer, setCorrectAnswer] = React.useState<string>('');
  const [imageNumber, setImageNumber] = React.useState<number>(0);
  const [timeLeft, setTimeLeft] = React.useState(questionTimeout);
  const { quizClient } = useQuizContext();
  const theme = useTheme();
  const notLarge = useMediaQuery(theme.breakpoints.down('lg'));
  const notMedium = useMediaQuery(theme.breakpoints.down('md'));
  const [imageSrc, setImageSrc] = React.useState<Record<string, string>>({ '1': '', '2': '' });
  const imagesClient = React.useMemo(() => new ImagesClient(IMAGES_SERVICE_URL), []);

  const finishQuizSession = useCallback(async () => {
    try {
      if (
        mode === 'classic' ||
        (mode === 'educational' && showCorrect === false) ||
        mode === 'time_limited'
      ) {
        console.log('submitting answer on finish');
        await quizClient.submitAnswer(
          sessionId,
          growthDirection,
          window.innerWidth,
          window.innerHeight
        );
      }
      await quizClient.finishQuiz(sessionId);
      nextStep();
    } catch (error) {
      console.error(error);
    }
  }, [quizClient, sessionId, nextStep, mode, growthDirection, showCorrect]);

  const getQuestion = useCallback(async () => {
    try {
      const data = await quizClient.getNextQuestion(sessionId);
      if (!data) {
        await finishQuizSession();
      }
      setQuestionData(data);
      if (mode === 'time_limited') {
        setTimeLeft(questionTimeout);
      }
    } catch (error) {
      console.error(error);
    }
  }, [quizClient, sessionId, mode, questionTimeout]);

  const handleClickNext = async () => {
    if (growthDirection === '' && mode !== 'educational' && mode !== 'time_limited') {
      alert('Please select a growth direction');
      return;
    }
    try {
      if (mode !== 'educational') {
        await quizClient.submitAnswer(
          sessionId,
          growthDirection,
          window.innerWidth,
          window.innerHeight
        );
      }
      await getQuestion();
    } catch (error) {
      console.error(error);
    }
    setShowCorrect(false);
    setGrowthDirection('');
  };

  const handleSubmitAnswer = async () => {
    try {
      const data = await quizClient.submitAnswer(
        sessionId,
        growthDirection,
        window.innerWidth,
        window.innerHeight
      );
      setCorrectAnswer(data.correct);
    } catch (error) {
      console.error(error);
    }
    setShowCorrect(true);
  };

  useEffect(() => {
    getQuestion();
    setQuestionLoading(false);
  }, [getQuestion]);

  useEffect(() => {
    const fetchImage = async (path: string) => {
      try {
        const res = await axios.get(
          IMAGES_SERVICE_URL + '/questions/' + questionData?.id.toString() + '/image/' + path,
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
    if (questionData) {
      fetchImage('1');
      fetchImage('2');
    }
  }, [questionData]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (mode === 'time_limited' && !showCorrect) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleClickNext();
            return questionTimeout;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, showCorrect]);

  if (questionLoading || !questionData) {
    return <Typography>Loading...</Typography>;
  }

  const renderImage = (path: string, alt: string) => (
    <Box component="img" alt={alt} src={imageSrc[path]} maxWidth="100%" maxHeight="100%" />
  );

  const renderTimer = () => {
    if (mode !== 'time_limited') return null;
    return (
      <Box sx={{ width: '100%', mb: 2 }}>
        <LinearProgress variant="determinate" value={(timeLeft / questionTimeout) * 100} />
        <Typography variant="body2" color="text.secondary" align="center">
          Time left: {timeLeft}s
        </Typography>
      </Box>
    );
  };

  const renderTable = () => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell align="left">Age of {questionData?.case?.age1}</TableCell>
            <TableCell align="center">Parameter</TableCell>
            <TableCell align="right">Age of {questionData?.case?.age2}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {questionData?.case.parameters?.map((param, index) => (
            <TableRow key={index}>
              <TableCell align="left">
                {questionData?.case?.parametersValues[index].value1}
              </TableCell>
              <TableCell component="th" scope="row" align="center">
                {param.name}
                <InfoTip
                  paramId={param.id}
                  title={param.name}
                  description={param.description}
                  referenceValues={param.referenceValues}
                  imagesClient={imagesClient}
                />
              </TableCell>
              <TableCell align="right">
                {questionData.case.parametersValues[index].value2}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderContent = () => {
    if (notMedium)
      return (
        <Grid2 container spacing={2} justifyContent="space-around">
          {imageNumber == 0 ? (
            <Grid2 size={12}>{renderImage('1', 'xray1')}</Grid2>
          ) : (
            <Grid2 size={12}>{renderImage('2', 'xray2')}</Grid2>
          )}
          <Grid2 size={12}>
            <Stack direction="row" justifyContent="center">
              <Button
                variant="outlined"
                onClick={() => {
                  setImageNumber(0);
                }}
                disabled={imageNumber == 0}
              >
                Image 1
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setImageNumber(1);
                }}
                disabled={imageNumber == 1}
              >
                Image 2
              </Button>
            </Stack>
          </Grid2>
          <Grid2 size={12} maxWidth="700px">
            {renderTable()}
          </Grid2>
        </Grid2>
      );
    if (notLarge)
      return (
        <Grid2 container spacing={4} justifyContent="space-around">
          <Grid2 size={6}>{renderImage('1', 'xray1')}</Grid2>
          <Grid2 size={6}>{renderImage('2', 'xray2')}</Grid2>
          <Grid2 size={12} maxWidth="700px">
            {renderTable()}
          </Grid2>
        </Grid2>
      );
    return (
      <Grid2 container spacing={2} alignItems="center">
        <Grid2 size={4}>{renderImage('1', 'xray1')}</Grid2>
        <Grid2 size={4} maxWidth="700px">
          {renderTable()}
        </Grid2>
        <Grid2 size={4}>{renderImage('2', 'xray2')}</Grid2>
      </Grid2>
    );
  };

  return (
    <Card sx={{ margin: { xs: 1, sm: 2, md: 3, lg: 4 } }}>
      <CardHeader
        title={`Patient ${questionData?.case.code || 'Unknown'}`}
        subheader={`Gender: ${questionData?.case.gender || 'Unknown'}`}
      />
      <CardContent>
        <Stack spacing={4}>
          {renderTimer()}
          {renderContent()}
          <FormControl component="fieldset">
            <FormLabel component="legend">
              Please try to predict the direction of facial growth at the age of{' '}
              {questionData?.predictionAge}
            </FormLabel>
            <RadioGroup
              aria-label="growth-direction"
              name="growth-direction"
              value={growthDirection}
              onChange={(e) => {
                if (!showCorrect) {
                  setGrowthDirection(e.target.value);
                }
              }}
            >
              {questionData?.options?.map((option) => {
                return showCorrect ? (
                  <FormControlLabel
                    key={option}
                    value={option}
                    control={<Radio />}
                    label={option}
                    sx={correctAnswer === option ? { color: 'green' } : { color: 'red' }}
                  />
                ) : (
                  <FormControlLabel
                    key={option}
                    value={option}
                    control={<Radio />}
                    label={option}
                  />
                );
              })}
            </RadioGroup>
          </FormControl>
          {mode !== 'educational' || showCorrect ? (
            <Button
              onClick={handleClickNext}
              variant="contained"
              disabled={growthDirection === '' && mode != 'educational'}
            >
              Next
            </Button>
          ) : (
            <Button onClick={() => handleSubmitAnswer()} variant="contained">
              Show Correct Answer
            </Button>
          )}
          <Button
            onClick={finishQuizSession}
            disabled={growthDirection === '' && mode != 'educational'}
          >
            Finish
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default QuizPage;
