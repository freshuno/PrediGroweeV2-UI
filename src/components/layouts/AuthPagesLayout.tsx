import React from 'react';
import { Box } from '@mui/material';

import TopNavBar from '@/components/ui/TopNavBar/TopNavBar';

interface LayoutProps {
  children: React.ReactNode;
}

const AuthPagesLayout = ({ children }: LayoutProps) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <TopNavBar />
    <Box
      component="main"
      sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}
    >
      {children}
    </Box>
  </Box>
);

export default AuthPagesLayout;
