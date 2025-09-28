import AuthPagesLayout from '@/components/layouts/AuthPagesLayout';
import { Button, Card, CardContent, CardHeader, Link, Typography } from '@mui/material';
import React from 'react';
import { useRouter } from 'next/router';

const VerifyEmail: React.FC = () => {
  const router = useRouter();
  return (
    <AuthPagesLayout>
      <Card sx={{ maxWidth: 450, width: '100%' }}>
        <CardHeader title="Verify your email" titleTypographyProps={{ align: 'center' }} />
        <CardContent>
          <Typography>
            We have sent an email to your email address. Please click the link in the email to
            verify your account.
          </Typography>
          <Typography>After verifying your email, you can log in to your account.</Typography>
          <Button
            LinkComponent={Link}
            onClick={async () => {
              await router.push('/login');
            }}
          >
            Log in
          </Button>
        </CardContent>
      </Card>
    </AuthPagesLayout>
  );
};
export default VerifyEmail;
