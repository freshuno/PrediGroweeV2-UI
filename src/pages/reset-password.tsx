import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { LoadingButton } from '@mui/lab';
import { Alert, Card, CardContent, CardHeader, TextField } from '@mui/material';
import * as yup from 'yup';
import { Form, Formik } from 'formik';
import AuthPagesLayout from '@/components/layouts/AuthPagesLayout';
import AuthClient from '@/Clients/AuthClient';
import { AUTH_SERVICE_URL } from '@/Envs';

const ResetPasswordSchema = yup.object({
  password: yup
    .string()
    .min(8, 'Password should be at least 8 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Password confirmation is required'),
});

export default function ResetPassword() {
  const authClient = React.useMemo(() => new AuthClient(AUTH_SERVICE_URL), []);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    console.log(router.query);
    if (!router.isReady) return;
    if (!router.query.token) {
      router.push('/login');
    }
    authClient.verifyResetToken(router.query.token as string).catch(() => {
      router.push('/login');
    });
  }, [router, authClient]);

  const { token } = router.query;

  const handleSubmit = async (
    values: { password: string },
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    try {
      setError(null);
      await authClient.confirmPasswordReset(token as string, values.password);
      await router.push('/login');
    } catch {
      setError('Failed to reset password. Please try again or request a new reset link.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPagesLayout>
      <Card sx={{ maxWidth: 450, width: '100%' }}>
        <CardHeader title="Reset Your Password" titleTypographyProps={{ align: 'center' }} />
        <CardContent>
          <Formik
            initialValues={{ password: '', confirmPassword: '' }}
            validationSchema={ResetPasswordSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
              <Form>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                <TextField
                  fullWidth
                  margin="normal"
                  name="password"
                  label="New Password"
                  type="password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                  helperText={touched.confirmPassword && errors.confirmPassword}
                />
                <LoadingButton
                  type="submit"
                  loading={isSubmitting}
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                >
                  Reset Password
                </LoadingButton>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </AuthPagesLayout>
  );
}
