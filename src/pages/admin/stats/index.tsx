import React from 'react';
import { Box, Button, Card, IconButton, Stack, Typography } from '@mui/material';
import TopNavBar from '@/components/ui/TopNavBar/TopNavBar';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ResponsesTable from './_components/ResponsesTable';
import QuestionStatsTable from '@/pages/admin/stats/_components/QuestionStatsTable';
import UserStats from './_components/UsersStats';

type Tab = 'recent responses' | 'questions stats' | 'users stats';
const Tabs: Tab[] = ['recent responses', 'questions stats', 'users stats'] as const;

const AdminStatsPanel = () => {
  const [activeTab, setActiveTab] = React.useState<Tab>('recent responses');
  const renderContent = () => {
    switch (activeTab) {
      case 'recent responses':
        return <ResponsesTable></ResponsesTable>;
      case 'questions stats':
        return <QuestionStatsTable></QuestionStatsTable>;
      case 'users stats':
        return <UserStats></UserStats>;
      default:
        return null;
    }
  };

  return (
    <Box>
      <TopNavBar />
      <Box py={3} maxWidth="lg" mx="auto" px={{ md: 2, xs: 1 }}>
        <Typography variant="h4" gutterBottom>
          <IconButton LinkComponent={Link} href="/admin" sx={{ mr: 2 }}>
            <ArrowBackIcon color="primary" />
          </IconButton>
          Quiz statistics
        </Typography>
        <Stack direction="row" gap={2} mb={2}>
          {Object.values(Tabs).map((tab) => {
            return (
              <Button
                variant={activeTab === tab ? 'contained' : 'outlined'}
                onClick={() => setActiveTab(tab)}
                key={tab}
                sx={{
                  backgroundColor: activeTab === tab ? 'primary' : '#ffff',
                  borderRadius: 3,
                }}
              >
                <Typography>{tab}</Typography>
              </Button>
            );
          })}
        </Stack>
        <Card>{renderContent()}</Card>
      </Box>
    </Box>
  );
};
export default AdminStatsPanel;
