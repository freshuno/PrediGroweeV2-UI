import React from 'react';
import { Box, Button, Card, IconButton, Stack, Typography } from '@mui/material';
import TopNavBar from '@/components/ui/TopNavBar/TopNavBar';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ResponsesTable from './_components/ResponsesTable';
import QuestionStatsTable from '@/pages/admin/stats/_components/QuestionStatsTable';
import UserStats from './_components/UsersStats';
import TestsStatsTable from './_components/TestsStatsTable';
import { useRouter } from 'next/router';

type Tab = 'recent responses' | 'questions stats' | 'users stats' | 'tests progress';
const Tabs: readonly Tab[] = [
  'recent responses',
  'questions stats',
  'users stats',
  'tests progress',
] as const;

const toSlug = (tab: Tab) => tab.toLowerCase().replace(/\s+/g, '-');

const fromQueryToTab = (raw?: string | string[]): Tab | null => {
  if (!raw) return null;
  const v = (Array.isArray(raw) ? raw[0] : raw).toLowerCase();
  const matchBySlug = Tabs.find((t) => toSlug(t) === v);
  if (matchBySlug) return matchBySlug as Tab;
  const matchByExact = Tabs.find((t) => t.toLowerCase() === v);
  return (matchByExact as Tab) || null;
};

const AdminStatsPanel = () => {
  const router = useRouter();

  const [activeTab, setActiveTab] = React.useState<Tab>('recent responses');

  React.useEffect(() => {
    if (!router.isReady) return;

    const qTab = fromQueryToTab(router.query.tab);
    if (qTab) {
      setActiveTab(qTab);
      return;
    }

    try {
      const saved = localStorage.getItem('admin-stats-active-tab') as Tab | null;
      if (saved && (Tabs as readonly Tab[]).includes(saved)) {
        setActiveTab(saved);
      }
    } catch {
      // ignore
    }
  }, [router.isReady, router.query.tab]);

  React.useEffect(() => {
    try {
      localStorage.setItem('admin-stats-active-tab', activeTab);
    } catch {
      // ignore
    }
  }, [activeTab]);

  const setTabAndSyncUrl = (tab: Tab) => {
    setActiveTab(tab);
    const tabSlug = toSlug(tab);
    router.replace(
      { pathname: router.pathname, query: { ...router.query, tab: tabSlug } },
      undefined,
      { shallow: true }
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'recent responses':
        return <ResponsesTable />;
      case 'questions stats':
        return <QuestionStatsTable />;
      case 'users stats':
        return <UserStats />;
      case 'tests progress':
        return <TestsStatsTable />;
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
                onClick={() => setTabAndSyncUrl(tab)}
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
