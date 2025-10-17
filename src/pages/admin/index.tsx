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
  Badge,
} from '@mui/material';
import Link from 'next/link';
import ActivityChart from './_components/ActivityChart';
import React from 'react';
import AdminClient from '@/Clients/AdminClient';
import { ADMIN_SERVICE_URL } from '@/Envs';
import { ActivityData, DashboardSummary } from '@/types';
import axios from 'axios';
import { useAuthContext } from '@/components/contexts/AuthContext';

type SecurityMode = 'cooldown' | 'manual';

const AdminPage = () => {
  const adminClient = React.useMemo(() => new AdminClient(ADMIN_SERVICE_URL), []);
  const [data, setData] = React.useState<ActivityData[]>([]);
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null);

  const [securityMode, setSecurityMode] = React.useState<SecurityMode>('cooldown');
  const [cooldownHours, setCooldownHours] = React.useState<number>(24);

  const [reportsPending, setReportsPending] = React.useState<number>(0);

  const role = useAuthContext().userData?.role ?? 'user';
  const canManageSecurity = role === 'admin';

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

    const loadPendingReports = async () => {
      try {
        const resp = await axios.get('/api/quiz/reports/pendingCount');
        setReportsPending(Number(resp.data?.count ?? 0));
      } catch {
        setReportsPending(0);
      }
    };

    getSummary();
    loadActivity();
    if (canManageSecurity) loadSecuritySettings();
    loadPendingReports();
  }, [adminClient, canManageSecurity]);

  const saveSecurity = async () => {
    if (!canManageSecurity) return;
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
        <Typography variant="h3" sx={{ fontSize: { xs: 28, sm: 32, md: 36 } }}>
          Admin Panel
        </Typography>

        <Grid2 container columns={12} spacing={4}>
          <Grid2 size={{ xs: 12, md: 8 }}>
            <Stack spacing={4}>
              <Card>
                <CardHeader title="Recent activity" />
                <CardContent sx={{ height: { xs: 300, sm: 400, md: 450 } }}>
                  <ActivityChart data={data} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Users" />
                <CardContent>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems="stretch"
                    justifyContent="flex-start"
                    flexWrap="wrap"
                  >
                    <Box sx={{ flex: '1 1 240px', minWidth: 0 }}>
                      <Typography>
                        Registered users: <strong>{summary?.authSummary?.users}</strong>
                      </Typography>
                      <Typography>
                        Active users: <strong>-</strong>
                      </Typography>
                      <Typography>
                        Last 24h registrations:{' '}
                        <strong>{summary?.authSummary?.lastRegistered}</strong>
                      </Typography>
                    </Box>

                    <Stack
                      direction={{ xs: 'column', sm: 'column' }}
                      spacing={1}
                      sx={{ ml: { sm: 3 }, alignItems: { xs: 'stretch', sm: 'flex-start' } }}
                    >
                      <Button
                        LinkComponent={Link}
                        href="/admin/users"
                        variant="contained"
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                      >
                        Show all users
                      </Button>
                      <Button
                        LinkComponent={Link}
                        href="/admin/surveys"
                        variant="contained"
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                      >
                        Show surveys
                      </Button>

                      <Badge
                        color="error"
                        variant="dot"
                        overlap="rectangular"
                        invisible={reportsPending === 0}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                      >
                        <Button
                          LinkComponent={Link}
                          href="/admin/reports"
                          variant="contained"
                          sx={{ width: { xs: '100%', sm: 'auto' }, position: 'relative' }}
                        >
                          Show bug reports
                        </Button>
                      </Badge>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Statistics" />
                <CardContent>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems="stretch"
                    justifyContent="flex-start"
                    flexWrap="wrap"
                  >
                    <Box sx={{ flex: '1 1 240px', minWidth: 0 }}>
                      <Typography>
                        Quiz sessions: <strong>{summary?.statsSummary?.quizSessions}</strong>
                      </Typography>
                      <Typography>
                        Total answers: <strong>{summary?.statsSummary?.totalResponses}</strong>
                      </Typography>
                      <Typography>
                        Correct answers: <strong>{summary?.statsSummary?.totalCorrect}</strong>
                      </Typography>
                    </Box>

                    <Stack
                      direction={{ xs: 'column', sm: 'column' }}
                      spacing={1}
                      sx={{ ml: { sm: 3 }, alignItems: { xs: 'stretch', sm: 'flex-start' } }}
                    >
                      <Button
                        LinkComponent={Link}
                        href="/admin/stats"
                        variant="contained"
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                      >
                        Show statistics
                      </Button>
                      <Button
                        LinkComponent={Link}
                        href="/admin/liveSessions"
                        variant="contained"
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                      >
                        Show Live Sessions
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid2>

          {/* Right column */}
          <Grid2 size={{ xs: 12, md: 4 }}>
            <Stack spacing={4}>
              <Card>
                <CardHeader title="Questions" />
                <CardContent>
                  <Typography>
                    Questions in database: <strong>{summary?.quizSummary?.questions}</strong>
                  </Typography>
                  <Button
                    LinkComponent={Link}
                    href="/admin/questions"
                    variant="contained"
                    sx={{ mt: 2, width: { xs: '100%', sm: 'auto' } }}
                  >
                    Show all questions
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Site content" />
                <CardContent>
                  <Typography>Manage about, contact and privacy pages</Typography>
                  <Button
                    LinkComponent={Link}
                    href="/admin/content"
                    variant="contained"
                    sx={{ mt: 2, width: { xs: '100%', sm: 'auto' } }}
                  >
                    Manage
                  </Button>
                </CardContent>
              </Card>

              {canManageSecurity && (
                <Card>
                  <CardHeader title="Quiz Security" />
                  <CardContent>
                    <Stack spacing={2}>
                      <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        Current mode:{' '}
                        <strong>
                          {securityMode === 'manual'
                            ? 'Manual approval'
                            : `Cooldown (${cooldownHours}h)`}
                        </strong>
                      </Typography>

                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        <label>
                          <input
                            type="radio"
                            name="qmode"
                            value="cooldown"
                            checked={securityMode === 'cooldown'}
                            onChange={() => setSecurityMode('cooldown')}
                            aria-label="Cooldown mode"
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
                            aria-label="Manual approval mode"
                          />{' '}
                          Manual approval
                        </label>
                      </Stack>

                      <TextField
                        id="cooldownHours"
                        label="Cooldown (hours)"
                        type="number"
                        value={cooldownHours}
                        fullWidth
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

                      <Button
                        variant="contained"
                        onClick={saveSecurity}
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                      >
                        Save security
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid2>
        </Grid2>
      </Stack>
    </Box>
  );
};

export default AdminPage;
