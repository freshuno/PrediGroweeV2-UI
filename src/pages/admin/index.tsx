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
  TextField,
} from '@mui/material';
import Link from 'next/link';
import ActivityChart from './_components/ActivityChart';
import React from 'react';
import AdminClient from '@/Clients/AdminClient';
import { ADMIN_SERVICE_URL } from '@/Envs';
import { ActivityData, DashboardSummary } from '@/types';
import axios from 'axios';

type SecurityMode = 'cooldown' | 'manual';

const AdminPage = () => {
  const adminClient = React.useMemo(() => new AdminClient(ADMIN_SERVICE_URL), []);
  const [data, setData] = React.useState<ActivityData[]>([]);
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null);

  const [securityMode, setSecurityMode] = React.useState<SecurityMode>('cooldown');
  const [cooldownHours, setCooldownHours] = React.useState<number>(24);

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

    const loadSecuritySettings = async () => {
      try {
        const resp = await axios.get('/api/quiz/settings');
        const settings = resp.data as Array<{ Name: string; Value: string }>;

        const mode =
          (settings.find((s) => s.Name === 'quiz_security_mode')?.Value as SecurityMode) ||
          'cooldown';
        const hoursRaw = settings.find((s) => s.Name === 'quiz_cooldown_hours')?.Value ?? '24';
        const hours = Number.parseInt(hoursRaw, 10);

        setSecurityMode(mode === 'manual' ? 'manual' : 'cooldown');
        setCooldownHours(Number.isFinite(hours) && hours >= 0 ? hours : 24);
      } catch {
        console.log('Failed to load quiz settings');
      }
    };

    getSummary();
    loadActivity();
    loadSecuritySettings();
  }, [adminClient]);

  const saveSecurity = async () => {
    const clamped = Math.max(0, Number(cooldownHours));
    try {
      await axios.post('/api/quiz/settings', [
        { Name: 'quiz_security_mode', Value: securityMode },
        { Name: 'quiz_cooldown_hours', Value: String(clamped) },
      ]);
      setCooldownHours(clamped);
      alert('Security settings saved');
    } catch {
      alert('Failed to save');
    }
  };

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

                  {/* Buttons in a vertical stack */}
                  <Stack direction="column" spacing={1} sx={{ mt: 2, alignItems: 'flex-start' }}>
                    <Button LinkComponent={Link} href="/admin/users" variant="contained">
                      Show all users
                    </Button>
                    <Button LinkComponent={Link} href="/admin/surveys" variant="contained">
                      Show surveys
                    </Button>
                    <Button LinkComponent={Link} href="/admin/reports" variant="contained">
                      Show bug reports
                    </Button>
                  </Stack>
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
                  <Button
                    LinkComponent={Link}
                    href="/admin/userStats"
                    variant="contained"
                    sx={{ mt: 2 }}
                  >
                    Show User Progress
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

          <Grid2 size={6}>
            <Card>
              <CardHeader title="Quiz Security" />
              <CardContent>
                <Stack spacing={2}>
                  {/* Current mode */}
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    Current mode:{' '}
                    <strong>
                      {securityMode === 'manual'
                        ? 'Manual approval'
                        : `Cooldown (${cooldownHours}h)`}
                    </strong>
                  </Typography>

                  {/* Mode selection */}
                  <Stack direction="row" spacing={2}>
                    <label>
                      <input
                        type="radio"
                        name="qmode"
                        value="cooldown"
                        checked={securityMode === 'cooldown'}
                        onChange={() => setSecurityMode('cooldown')}
                      />{' '}
                      Cooldown
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="qmode"
                        value="manual"
                        checked={securityMode === 'manual'}
                        onChange={() => setSecurityMode('manual')}
                      />{' '}
                      Manual approval
                    </label>
                  </Stack>

                  {/* Cooldown hours (min 0) */}
                  <TextField
                    id="cooldownHours"
                    label="Cooldown (hours)"
                    type="number"
                    value={cooldownHours}
                    onKeyDown={(e) => {
                      if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onPaste={(e) => {
                      const text = e.clipboardData.getData('text');
                      if (!/^\d+$/.test(text)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const v = e.target.value;
                      const n = v === '' ? 0 : Number.parseInt(v, 10);
                      setCooldownHours(Number.isFinite(n) ? Math.max(0, n) : 0);
                    }}
                    inputProps={{ min: 0, step: 1, inputMode: 'numeric' }}
                  />

                  <Button variant="contained" onClick={saveSecurity}>
                    Save security
                  </Button>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField id="approveUserId" label="User ID to approve" type="number" />
                    <Button
                      variant="outlined"
                      onClick={async () => {
                        const approveEl = document.getElementById(
                          'approveUserId'
                        ) as HTMLInputElement | null;
                        const uid = Number(approveEl?.value || 0);
                        if (!uid) return alert('Enter user id');
                        try {
                          await axios.post('/api/quiz/approve', { user_id: uid });
                          alert('User approved');
                        } catch {
                          alert('Failed to approve');
                        }
                      }}
                    >
                      Approve user
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>
      </Stack>
    </Box>
  );
};

export default AdminPage;
