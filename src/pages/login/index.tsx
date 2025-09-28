import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Link,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Form, Formik, FormikHelpers } from 'formik';
import AuthPagesLayout from '@/components/layouts/AuthPagesLayout';
import LoginValidate from '@/components/LoginValidate';
import { LoadingButton } from '@mui/lab';
import { useAuthContext } from '@/components/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useGoogleLogin } from '@react-oauth/google';
import GoogleIcon from '@/static/icons/GoogleIcon';

type LoginFormValues = {
  email: string;
  password: string;
};
const initialValues: LoginFormValues = {
  email: '',
  password: '',
};

export default function Index() {
  const router = useRouter();
  const { login, loginWithGoogle, resetPassword } = useAuthContext();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleSubmit = async (
    values: LoginFormValues,
    { setSubmitting }: FormikHelpers<LoginFormValues>
  ) => {
    setSubmitting(true);
    try {
      await login(values.email, values.password);
      await router.push('/quiz');
    } catch {
      alert('Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    setResetDialogOpen(true);
  };

  const handleResetSubmit = async () => {
    try {
      await resetPassword(resetEmail);
      setResetDialogOpen(false);
      alert('Password reset instructions have been sent to your email');
    } catch {
      alert('Failed to send reset password email');
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const firstLogin = await loginWithGoogle(tokenResponse.access_token);
        if (firstLogin) {
          await router.push('/register/survey');
        } else {
          await router.push('/quiz');
        }
      } catch {
        console.log('Google login failed');
      }
    },
    onError: () => console.log('Google Login failed:'),
  });

  return (
    <AuthPagesLayout>
      <Card sx={{ maxWidth: 450, width: '100%' }}>
        <CardHeader title="Log in to PrediGrowee" titleTypographyProps={{ align: 'center' }} />
        <CardContent>
          <Box sx={{ mt: 1 }}>
            <Formik
              initialValues={initialValues}
              validationSchema={LoginValidate}
              onSubmit={handleSubmit}
              validateOnChange
            >
              {({ touched, errors, values, handleChange, handleBlur, isSubmitting }) => (
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
                  <LoadingButton
                    type="submit"
                    loading={isSubmitting}
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                  >
                    Login
                  </LoadingButton>
                </Form>
              )}
            </Formik>
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
            <Typography align="center" variant="body2">
              OR
            </Typography>
            <Box sx={{ textAlign: 'center', mt: 1, mb: 2 }}>
              <Link href="/register" variant="body2">
                Register
              </Link>
            </Box>
            <Typography align="center" variant="body2">
              Forgot password?
            </Typography>
            <Button fullWidth variant="text" onClick={() => handleReset()} sx={{ mb: 2 }}>
              Reset password
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, mt: 2 }}>
            Enter your email address. We&apos;ll send you instructions to reset your password.
          </Typography>
          <TextField
            fullWidth
            label="Email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            type="email"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleResetSubmit} variant="contained">
            Send Instructions
          </Button>
        </DialogActions>
      </Dialog>
    </AuthPagesLayout>
  );
}
