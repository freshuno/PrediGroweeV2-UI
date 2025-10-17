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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { useQuizContext } from '@/components/contexts/QuizContext';
import { useMediaQuery } from '@mui/system';
import { QuestionData, QuizMode } from '@/types';
import axios from 'axios';
import InfoTip from './InfoTip';
import { IMAGES_SERVICE_URL } from '@/Envs';
import ImagesClient from '@/Clients/ImagesClient';

const QUESTION_TIMEOUT = 30;

// Types for V3 reveal endpoint
type V3Item = {
  parameter_id?: number;
  parameterId?: number;
  id?: number;
  value3: number | null;
};

type V3Response = {
  age3: number;
  values: V3Item[];
};

// local type with __isLast flag
type NextQuestionWithFlag = QuestionData & { __isLast?: boolean };

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
  const [imageSrc, setImageSrc] = React.useState<Record<string, string>>({
    '1': '',
    '2': '',
    '3': '',
  });
  const imagesClient = React.useMemo(() => new ImagesClient(IMAGES_SERVICE_URL), []);
  const [hasAnyAnswer, setHasAnyAnswer] = React.useState(false);

  // v3 reveal
  const showThirdCol = mode === 'educational' && showCorrect;
  const [v3Loaded, setV3Loaded] = React.useState(false);

  // report dialog state
  const [reportOpen, setReportOpen] = React.useState(false);
  const [reportText, setReportText] = React.useState('');
  const [reportSending, setReportSending] = React.useState(false);
  const [reportSubmittedForCase, setReportSubmittedForCase] = React.useState<number | null>(null);

  // last-question flag
  const [isLast, setIsLast] = React.useState(false);

  // Finish with conditional submit
  const finishQuizSession = useCallback(async () => {
    try {
      const shouldSubmitOnFinish =
        growthDirection.trim() !== '' && !(mode === 'educational' && showCorrect);

      if (shouldSubmitOnFinish) {
        await quizClient.submitAnswer(
          sessionId,
          growthDirection,
          window.innerWidth,
          window.innerHeight
        );
        setHasAnyAnswer(true);
      }
      await quizClient.finishQuiz(sessionId);
      nextStep();
    } catch (error) {
      console.error(error);
    }
  }, [quizClient, sessionId, nextStep, mode, showCorrect, growthDirection]);

  // Load next question
  const getQuestion = useCallback(async () => {
    try {
      const data = (await quizClient.getNextQuestion(sessionId)) as NextQuestionWithFlag | null;
      if (!data) {
        await quizClient.finishQuiz(sessionId);
        nextStep();
        return;
      }

      setIsLast(Boolean(data.__isLast));
      const { __isLast: _omit, ...questionOnly } = data;
      void _omit;

      setQuestionData(questionOnly as QuestionData);
      setShowCorrect(false);
      setGrowthDirection('');
      setImageSrc({ '1': '', '2': '', '3': '' });
      setImageNumber(0);
      setV3Loaded(false);
      if (mode === 'time_limited') setTimeLeft(questionTimeout);
      setReportSubmittedForCase(null);
      setReportText('');
    } catch (error) {
      console.error(error);
    }
  }, [quizClient, sessionId, mode, questionTimeout, nextStep]);

  const handleClickNext = useCallback(async () => {
    if (growthDirection === '' && mode !== 'educational') {
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
        setHasAnyAnswer(true);
      }
      await getQuestion();
    } catch (error) {
      console.error(error);
    }
  }, [mode, growthDirection, quizClient, sessionId, getQuestion]);

  // Auto-submit in time_limited
  const handleTimeoutAutoSubmit = useCallback(async () => {
    if (!questionData) {
      await getQuestion();
      return;
    }
    const options = questionData.options || [];
    let answerToUse = growthDirection;
    if (!answerToUse) {
      if (options.length === 0) {
        await getQuestion();
        return;
      }
      const idx = Math.floor(Math.random() * options.length);
      answerToUse = options[idx];
    }
    try {
      await quizClient.submitAnswer(sessionId, answerToUse, window.innerWidth, window.innerHeight);
      setHasAnyAnswer(true);
    } catch (error) {
      console.error(error);
    }
    await getQuestion();
  }, [questionData, growthDirection, quizClient, sessionId, getQuestion]);

  // Educational: Show Correct Answer (now requires selecting an option first)
  const handleSubmitAnswer = async () => {
    if (growthDirection.trim() === '') {
      alert('Please select an answer first');
      return;
    }
    try {
      const data = await quizClient.submitAnswer(
        sessionId,
        growthDirection,
        window.innerWidth,
        window.innerHeight
      );
      setCorrectAnswer(data.correct);
      if (growthDirection !== '') setHasAnyAnswer(true);
    } catch (error) {
      console.error(error);
    }
    setShowCorrect(true);
  };

  useEffect(() => {
    getQuestion();
    setQuestionLoading(false);
  }, [getQuestion]);

  // Images 1/2
  useEffect(() => {
    const fetchImage = async (path: string) => {
      try {
        const res = await axios.get(
          '/api/images/questions/' + questionData?.id?.toString() + '/image/' + path,
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
    if (questionData?.id) {
      fetchImage('1');
      fetchImage('2');
    }
  }, [questionData?.id]);

  // Image 3 (after Show Correct in educational)
  useEffect(() => {
    const fetchImage3 = async () => {
      if (!questionData?.id) return;
      try {
        const res = await axios.get(
          '/api/images/questions/' + questionData.id.toString() + '/image/3',
          {
            responseType: 'blob',
            headers: { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') },
          }
        );
        const imageUrl = URL.createObjectURL(res.data);
        setImageSrc((prev) => ({ ...prev, '3': imageUrl }));
      } catch (error) {
        console.error(error);
      }
    };
    if (mode === 'educational' && showCorrect && !imageSrc['3']) {
      fetchImage3();
    }
  }, [mode, showCorrect, questionData?.id, imageSrc['3']]);

  // V3: fetch age3 + value3 only after Show Correct (educational)
  useEffect(() => {
    const fetchV3 = async () => {
      if (!questionData?.case?.id || v3Loaded) return;
      try {
        const res = await axios.get<V3Response>(
          `/api/quiz/cases/${questionData.case.id}/parameters/v3`,
          { headers: { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') } }
        );
        const data = res.data;

        setQuestionData((prev) => {
          if (!prev) return prev;

          const pairs: Array<[number | undefined, number | null]> = data.values.map((v) => [
            v.parameter_id ?? v.parameterId ?? v.id,
            v.value3 ?? null,
          ]);
          const v3ByParamId = new Map(pairs);

          const merged = prev.case.parametersValues.map((pv, i) => {
            const pid = prev.case.parameters[i]?.id;
            const v3 = pid ? v3ByParamId.get(pid) : undefined;
            return { ...pv, value3: v3 ?? pv.value3 };
          });

          return {
            ...prev,
            case: {
              ...prev.case,
              age3: data.age3 ?? prev.case.age3,
              parametersValues: merged,
            },
          };
        });

        setV3Loaded(true);
      } catch (e) {
        console.error(e);
      }
    };

    if (mode === 'educational' && showCorrect) {
      fetchV3();
    }
  }, [mode, showCorrect, questionData?.case?.id, v3Loaded]);

  // Timer in time_limited
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (mode === 'time_limited' && !showCorrect) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeoutAutoSubmit();
            return questionTimeout;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, showCorrect, questionTimeout, handleTimeoutAutoSubmit]);

  if (questionLoading || !questionData) {
    return <Typography>Loading...</Typography>;
  }

  const renderImage = (path: string, alt: string) => (
    <Box
      component="img"
      alt={alt}
      src={imageSrc[path]}
      sx={{
        width: '100%',
        height: 'auto',
        maxHeight: 480,
        objectFit: 'contain',
        display: 'block',
        mx: 'auto',
      }}
    />
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
            {showThirdCol && <TableCell align="right">Age of {questionData?.case?.age3}</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {questionData?.case.parameters?.map((param, index) => {
            const pv = questionData?.case?.parametersValues?.[index];
            return (
              <TableRow key={param.id ?? index}>
                <TableCell align="left">{pv?.value1}</TableCell>
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
                <TableCell align="right">{pv?.value2}</TableCell>
                {showThirdCol && <TableCell align="right">{pv?.value3 ?? '—'}</TableCell>}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const hasThirdImage = mode === 'educational' && showCorrect && !!imageSrc['3'];

  const renderContent = () => {
    if (notMedium)
      return (
        <Grid2 container spacing={2} justifyContent="space-around">
          {imageNumber === 0 ? (
            <Grid2 size={12}>{renderImage('1', 'xray1')}</Grid2>
          ) : imageNumber === 1 ? (
            <Grid2 size={12}>{renderImage('2', 'xray2')}</Grid2>
          ) : (
            <Grid2 size={12}>{renderImage('3', 'xray3')}</Grid2>
          )}
          <Grid2 size={12}>
            <Stack direction="row" justifyContent="center" spacing={1}>
              <Button
                variant="outlined"
                onClick={() => setImageNumber(0)}
                disabled={imageNumber === 0}
              >
                Image 1
              </Button>
              <Button
                variant="outlined"
                onClick={() => setImageNumber(1)}
                disabled={imageNumber === 1}
              >
                Image 2
              </Button>
              {hasThirdImage && (
                <Button
                  variant="outlined"
                  onClick={() => setImageNumber(2)}
                  disabled={imageNumber === 2}
                >
                  Image 3
                </Button>
              )}
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
          {hasThirdImage && <Grid2 size={6}>{renderImage('3', 'xray3')}</Grid2>}
        </Grid2>
      );

    return (
      <Grid2 container spacing={2} alignItems="center">
        <Grid2 size={4}>{renderImage('1', 'xray1')}</Grid2>
        <Grid2 size={4} maxWidth="700px">
          {renderTable()}
        </Grid2>
        <Grid2 size={4}>{renderImage('2', 'xray2')}</Grid2>
        {hasThirdImage && (
          <>
            <Grid2 size={4} />
            <Grid2 size={4}>{renderImage('3', 'xray3')}</Grid2>
            <Grid2 size={4} />
          </>
        )}
      </Grid2>
    );
  };

  const submitReport = async () => {
    if (!questionData?.case?.id) return;
    const text = reportText.trim();
    if (!text) return;

    try {
      setReportSending(true);
      await axios.post(
        `/api/quiz/cases/${questionData.case.id}/report`,
        { description: text },
        { headers: { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') } }
      );
      setReportSubmittedForCase(questionData.case.id);
      setReportOpen(false);
      setReportText('');
      alert('Thank you! Your report has been sent.');
    } catch (e) {
      console.error(e);
      alert('Failed to send the report.');
    } finally {
      setReportSending(false);
    }
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
                if (!showCorrect) setGrowthDirection(e.target.value);
              }}
            >
              {questionData?.options?.map((option) =>
                showCorrect ? (
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
                )
              )}
            </RadioGroup>
          </FormControl>

          <Stack direction="row" spacing={2}>
            {mode !== 'educational' || showCorrect ? (
              <Button
                onClick={handleClickNext}
                variant="contained"
                disabled={(mode !== 'educational' && growthDirection === '') || isLast}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmitAnswer}
                variant="contained"
                disabled={growthDirection.trim() === ''}
              >
                Show Correct Answer
              </Button>
            )}

            <Button
              onClick={finishQuizSession}
              disabled={!hasAnyAnswer && growthDirection.trim() === ''}
            >
              Finish
            </Button>

            <Button
              variant="text"
              onClick={() => setReportOpen(true)}
              disabled={reportSubmittedForCase === questionData?.case?.id}
            >
              Report a problem
            </Button>
          </Stack>
        </Stack>
      </CardContent>

      <Dialog open={reportOpen} onClose={() => setReportOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Report a problem with this question</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            minRows={4}
            fullWidth
            placeholder="Describe what is wrong (missing image, wrong parameter, typo, etc.)"
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            inputProps={{ maxLength: 4000 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportOpen(false)} disabled={reportSending}>
            Cancel
          </Button>
          <Button
            onClick={submitReport}
            variant="contained"
            disabled={reportSending || !reportText.trim()}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default QuizPage;
