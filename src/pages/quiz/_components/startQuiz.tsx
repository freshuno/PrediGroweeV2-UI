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

type QuizFormValues = {
  mode: QuizMode;
};

const initialValues: QuizFormValues = {
  mode: 'classic',
};

const validationSchema = Yup.object().shape({
  mode: Yup.string().oneOf(QUIZ_MODES, 'Invalid quiz mode').required('Please select a quiz mode'),
});

export default function StartQuiz({
  nextStep,
}: {
  nextStep: (sessionId: string, mode: QuizMode, timeLimit?: number) => void;
}) {
  const router = useRouter();
  const { quizClient } = useQuizContext();
  const statsClient = React.useMemo(() => new StatsClient(STATS_SERVICE_URL), []);
  const [enabled, setEnabled] = React.useState(false);

  const handleSubmit = async (
    values: QuizFormValues,
    { setSubmitting }: FormikHelpers<QuizFormValues>
  ) => {
    setSubmitting(true);
    try {
      const data = await quizClient.startQuiz(values.mode, window.innerWidth, window.innerHeight);
      nextStep(data.session.sessionId, data.session.quizMode, data?.timeLimit);
    } catch {
      alert('Failed to start quiz');
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
                      <FormControlLabel value="classic" control={<Radio />} label="Classic" />
                      <FormControlLabel
                        value="educational"
                        control={<Radio />}
                        label="Educational"
                      />
                      <FormControlLabel
                        value="time_limited"
                        control={<Radio />}
                        label="Time Limited"
                      />
                    </RadioGroup>
                  </FormControl>
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
