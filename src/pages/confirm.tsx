import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Link,
  CardHeader,
} from '@mui/material';
import AuthPagesLayout from '../components/layouts/AuthPagesLayout';

export default function ConfirmAccount() {
  return (
    <AuthPagesLayout>
      <Card sx={{ maxWidth: 450, width: '100%' }}>
        <CardHeader
          title="Resend confirmation instructions"
          titleTypographyProps={{ align: 'center' }}
        />
        <CardContent>
          <Typography variant="body2" align="center" sx={{ mb: 2 }}>
            If You haven&amp;#39;t received an email with the confirmation link, or your link has
            expired, You can use the form below to get a new email from us.
          </Typography>
          <Box component="form" noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, bgcolor: '#a5b4fc', '&:hover': { bgcolor: '#8c9eff' } }}
            >
              Resend Confirmation Instructions
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link href="/login" variant="body2">
                Login
              </Link>
              <br />
              <Link href="/register" variant="body2">
                Register
              </Link>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </AuthPagesLayout>
  );
}
