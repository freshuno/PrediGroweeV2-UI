import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
  TextField,
} from '@mui/material';
import { Form, Formik, FormikHelpers } from 'formik';
import AuthPagesLayout from '@/components/layouts/AuthPagesLayout';
import { LoadingButton } from '@mui/lab';
import * as Yup from 'yup';
import { useQuizContext } from '@/components/contexts/QuizContext';
import { QuizMode, QUIZ_MODES } from '@/types';
import StatsClient from '@/Clients/StatsClient';
import { STATS_SERVICE_URL } from '@/Envs';
import { useRouter } from 'next/router';
import axios from 'axios';

type QuizFormValues = {
  mode: QuizMode;
  testCode?: string;
};

const initialValues: QuizFormValues = {
  mode: 'educational',
  testCode: '',
};

const validationSchema = Yup.object().shape({
  mode: Yup.string().oneOf(QUIZ_MODES, 'Invalid quiz mode').required('Please select a quiz mode'),
});

type StartQuizError = {
  error?: 'approval_required' | 'cooldown_active' | 'invalid_test_code' | string;
  message?: string;
  waitSeconds?: number;
  cooldownHours?: number;
  readyAt?: string;
  mode?: string;
};

function formatWait(seconds?: number) {
  if (!seconds || seconds <= 0) return 'a moment';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function StartQuiz({
  nextStep,
}: {
  nextStep: (sessionId: string, mode: QuizMode, timeLimit?: number) => void;
}) {
  const router = useRouter();
  const { quizClient } = useQuizContext();
  const statsClient = React.useMemo(() => new StatsClient(STATS_SERVICE_URL), []);
  const [enabled, setEnabled] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (
    values: QuizFormValues,
    { setSubmitting }: FormikHelpers<QuizFormValues>
  ) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const data = await quizClient.startQuiz(
        values.mode,
        window.innerWidth,
        window.innerHeight,
        values.testCode?.trim() || undefined
      );
      nextStep(data.session.sessionId, data.session.quizMode, data?.timeLimit);
    } catch (err: unknown) {
      let msg = 'Failed to start quiz';
      if (axios.isAxiosError<StartQuizError | string>(err) && err.response) {
        const data = err.response.data;
        if (typeof data === 'string') {
          msg = data;
        } else if (data?.error === 'approval_required') {
          msg = 'Your account must be approved by an administrator before you can start the quiz.';
        } else if (data?.error === 'cooldown_active') {
          msg = `Please wait ${formatWait(data?.waitSeconds)} before starting the quiz.`;
        } else if (data?.error === 'invalid_test_code') {
          msg = 'Invalid test code. Please check the code and try again.';
        } else if (typeof data?.message === 'string') {
          msg = data.message;
        }
      }
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  React.useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const survey = await statsClient.getSurveyResponse();
        if (survey.name !== '') {
          setEnabled(true);
        }
      } catch {
        router.push('/register/survey');
      }
    };
    fetchSurvey();
  }, [statsClient, router]);

  return (
    <AuthPagesLayout>
      <Card sx={{ maxWidth: 450, width: '100%' }}>
        <CardHeader title="Start a Quiz" titleTypographyProps={{ align: 'center' }} />
        <CardContent>
          {errorMsg && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {errorMsg}
            </Alert>
          )}
          <Box sx={{ mt: 1 }}>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ values, handleChange, isSubmitting }) => (
                <Form>
                  <FormControl component="fieldset" margin="normal">
                    <FormLabel component="legend">Select Quiz Mode</FormLabel>
                    <RadioGroup
                      aria-label="quiz-mode"
                      name="mode"
                      value={values.mode}
                      onChange={handleChange}
                    >
                      <FormControlLabel
                        value="educational"
                        control={<Radio />}
                        label="Educational (Start With This One!)"
                      />
                      <FormControlLabel value="classic" control={<Radio />} label="Classic" />
                      <FormControlLabel
                        value="time_limited"
                        control={<Radio />}
                        label="Time Limited"
                      />
                    </RadioGroup>
                  </FormControl>

                  <TextField
                    name="testCode"
                    label="Test code (optional)"
                    value={values.testCode || ''}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    placeholder="e.g. ABC123"
                    inputProps={{ maxLength: 24 }}
                  />

                  <LoadingButton
                    type="submit"
                    variant="contained"
                    loading={isSubmitting}
                    fullWidth
                    sx={{ mt: 3, mb: 2 }}
                    disabled={!enabled}
                  >
                    Start Quiz
                  </LoadingButton>
                </Form>
              )}
            </Formik>
          </Box>
        </CardContent>
      </Card>
    </AuthPagesLayout>
  );
}
