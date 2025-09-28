import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import AuthPagesLayout from '../../components/layouts/AuthPagesLayout';
import { Formik, Form, FormikHelpers } from 'formik';
import RegisterValidate from '../../components/RegisterValidate';
import { useAuthContext } from '@/components/contexts/AuthContext';
import { useRouter } from 'next/router';
import ReCAPTCHA from 'react-google-recaptcha';
import GoogleIcon from '@/static/icons/GoogleIcon';
import { useGoogleLogin } from '@react-oauth/google';

export type RegisterFormValues = {
  email: string;
  password: string;
  retypePassword: string;
  notRobot: string;
};
const initialValues: RegisterFormValues = {
  email: '',
  password: '',
  retypePassword: '',
  notRobot: '',
};

export default function Register() {
  const { loginWithGoogle } = useAuthContext();
  const router = useRouter();
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const firstLogin = await loginWithGoogle(tokenResponse.access_token);
        if (firstLogin) {
          await router.push('/register/survey');
        } else {
          await router.push('/quiz');
        }
        // eslint-disable-next-line no-empty
      } catch {}
    },
    onError: () => console.log('Google Login failed:'),
  });
  const { register } = useAuthContext();
  const handleSubmit = async (
    values: RegisterFormValues,
    { setSubmitting }: FormikHelpers<RegisterFormValues>
  ) => {
    setSubmitting(true);
    try {
      await register(values.email, values.password);
      await router.push('/register/verify');
    } catch (error) {
      alert(error);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <AuthPagesLayout>
      <Card sx={{ maxWidth: 450, width: '100%' }}>
        <CardHeader title="Register to PrediGrowee" titleTypographyProps={{ align: 'center' }} />
        <CardContent>
          <Box sx={{ mt: 1 }}>
            <Formik
              onSubmit={handleSubmit}
              initialValues={initialValues}
              validationSchema={RegisterValidate}
              validateOnChange
            >
              {({
                touched,
                errors,
                values,
                handleChange,
                handleBlur,
                isSubmitting,
                setFieldValue,
              }) => (
                <Form>
                  <TextField
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    margin="normal"
                    fullWidth
                    id="email"
                    label="Email"
                    name="email"
                    autoComplete="email"
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                  />
                  <TextField
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    error={touched.password && Boolean(errors.password)}
                    helperText={touched.password && errors.password}
                  />
                  <TextField
                    value={values.retypePassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    margin="normal"
                    required
                    fullWidth
                    name="retypePassword"
                    label="Retype password"
                    type="password"
                    id="retypePassword"
                    error={touched.retypePassword && Boolean(errors.retypePassword)}
                    helperText={touched.retypePassword && errors.retypePassword}
                    sx={{ mb: 2 }}
                  />
                  <ReCAPTCHA
                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? 'a'}
                    onChange={(val) => {
                      setFieldValue('notRobot', val, true);
                    }}
                  />
                  <LoadingButton
                    type="submit"
                    loading={isSubmitting}
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                  >
                    Register
                  </LoadingButton>
                  <Typography align="center" variant="body2">
                    OR
                  </Typography>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleGoogleLogin()}
                    startIcon={<GoogleIcon width="24px" />}
                    sx={{ mt: 2, mb: 2 }}
                  >
                    Log in with Google
                  </Button>
                  <Box sx={{ textAlign: 'center' }}>
                    <Link href="/login" variant="body2">
                      Login
                    </Link>
                  </Box>
                </Form>
              )}
            </Formik>
          </Box>
        </CardContent>
      </Card>
    </AuthPagesLayout>
  );
}
