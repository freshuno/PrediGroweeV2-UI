import TopNavBar from '@/components/ui/TopNavBar/TopNavBar';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid2,
  Stack,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import ActivityChart from './_components/ActivityChart';
import React from 'react';
import AdminClient from '@/Clients/AdminClient';
import { ADMIN_SERVICE_URL } from '@/Envs';
import { ActivityData, DashboardSummary } from '@/types';

const AdminPage = () => {
  const adminClient = React.useMemo(() => new AdminClient(ADMIN_SERVICE_URL), []);
  const [data, setData] = React.useState<ActivityData[]>([]);
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null);
  React.useEffect(() => {
    const loadActivity = async () => {
      try {
        const data = await adminClient.getAllActivity();
        setData(data);
      } catch {
        console.log('Failed to load activity');
      }
    };
    const getSummary = async () => {
      try {
        const data = await adminClient.getDashboardSummary();
        setSummary(data);
      } catch {
        console.log('Failed to load summary');
      }
    };
    getSummary();
    loadActivity();
  }, [adminClient]);
  return (
    <Box>
      <TopNavBar />
      <Stack
        component="main"
        spacing={4}
        sx={{
          maxWidth: 'lg',
          width: '100%',
          marginX: 'auto',
          marginTop: 4,
          padding: 2,
        }}
      >
        <Typography variant="h3">Admin Panel</Typography>
        <Grid2 columns={12} container spacing={4} flexDirection="row" flexWrap="wrap">
          <Grid2 size={8}>
            <Card>
              <CardHeader title="Recent activity" />
              <CardContent sx={{ height: 450 }}>
                <ActivityChart data={data} />
              </CardContent>
            </Card>
          </Grid2>
          <Grid2 size={4}>
            <Stack direction="column" justifyContent="space-between" spacing={4} flexGrow={1}>
              <Card sx={{ flexGrow: 1 }}>
                <CardHeader title="Users" />
                <CardContent>
                  <Typography>
                    Registered users: <strong>{summary?.authSummary?.users}</strong>
                  </Typography>
                  <Typography>
                    Active users: <strong>-</strong>
                  </Typography>
                  <Typography>
                    Last 24h registrations: <strong>{summary?.authSummary?.lastRegistered}</strong>
                  </Typography>
                  <Button
                    LinkComponent={Link}
                    href="/admin/users"
                    variant="contained"
                    sx={{ mt: 2 }}
                  >
                    Show all users
                  </Button>
                </CardContent>
              </Card>

              <Card sx={{ flexGrow: 1 }}>
                <CardHeader title="Statistics" />
                <CardContent>
                  <Typography>
                    Quiz sessions: <strong>{summary?.statsSummary?.quizSessions}</strong>
                  </Typography>
                  <Typography>
                    Total answers: <strong>{summary?.statsSummary?.totalResponses}</strong>
                  </Typography>
                  <Typography>
                    Correct answers: <strong>{summary?.statsSummary?.totalCorrect}</strong>
                  </Typography>
                  <Button
                    LinkComponent={Link}
                    href="/admin/stats"
                    variant="contained"
                    sx={{ mt: 2 }}
                  >
                    Show statistics
                  </Button>
                </CardContent>
              </Card>
            </Stack>
          </Grid2>
          <Grid2 size={6}>
            <Card sx={{ height: 'auto' }}>
              <CardHeader title="Questions" />
              <CardContent>
                <Typography>
                  Questions in database: <strong>{summary?.quizSummary?.questions}</strong>
                </Typography>
                <Button
                  LinkComponent={Link}
                  href="/admin/questions"
                  variant="contained"
                  sx={{ mt: 2 }}
                >
                  Show all questions
                </Button>
              </CardContent>
            </Card>
          </Grid2>
          <Grid2 size={6}>
            <Card>
              <CardHeader title="Site content" />
              <CardContent>
                <Typography>Manage about, contact and privacy pages</Typography>
                <Button
                  LinkComponent={Link}
                  href="/admin/content"
                  variant="contained"
                  sx={{ mt: 2 }}
                >
                  Manage
                </Button>
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>
      </Stack>
    </Box>
  );
};

export default AdminPage;
