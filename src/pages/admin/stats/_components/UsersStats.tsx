import React, { useState, useEffect } from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Card,
  CardContent,
  Tab,
  Tabs,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import AdminClient from '@/Clients/AdminClient';
import { ADMIN_SERVICE_URL } from '@/Envs';
import { SurveyGroupedStats, UserQuizStats, UserSurvey } from '@/types';
import UsersTable from './UsersTable';

const groupingOptions = [
  { value: 'education', label: 'Education Level' },
  { value: 'experience', label: 'Experience' },
  { value: 'age', label: 'Age' },
  { value: 'gender', label: 'Gender' },
  { value: 'vision_defect', label: 'Vision' },
  { value: 'country', label: 'Country' },
];

const UserStats = () => {
  const [selectedGroup, setSelectedGroup] = useState('education');
  const [view, setView] = useState('chart');
  const [data, setData] = useState<SurveyGroupedStats[]>([]);
  const [userStats, setUserStats] = useState<UserQuizStats[]>([]);
  const [surveys, setSurveys] = useState<UserSurvey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedData = React.useMemo(() => {
    return data.map((item) => ({
      ...item,
      accuracyPercentage: Math.round(item.accuracy * 100),
    }));
  }, [data]);

  const adminClient = React.useMemo(() => new AdminClient(ADMIN_SERVICE_URL), []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, surveysData, usersStats] = await Promise.all([
          adminClient.getStatsGroupedBySurvey(selectedGroup),
          adminClient.getAllSurveyResponses(),
          adminClient.getAllUsersStats(),
        ]);
        setData(statsData);
        setSurveys(surveysData);
        setUserStats(usersStats);
        setError(null);
      } catch (err) {
        setError('Failed to fetch statistics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedGroup, adminClient]);

  const handleGroupChange = (_: React.MouseEvent<HTMLElement>, newGroup: string) => {
    if (newGroup !== null) {
      setSelectedGroup(newGroup);
    }
  };

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            User Statistics
          </Typography>
          <Tabs value={view} onChange={(_, newValue) => setView(newValue)} sx={{ mb: 2 }}>
            <Tab label="Chart View" value="chart" />
            <Tab label="Table View" value="table" />
          </Tabs>

          {view === 'chart' && (
            <>
              <ToggleButtonGroup
                value={selectedGroup}
                exclusive
                onChange={handleGroupChange}
                aria-label="grouping options"
                size="small"
                sx={{ mb: 2 }}
              >
                {groupingOptions.map((option) => (
                  <ToggleButton key={option.value} value={option.value}>
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              <Box height={400}>
                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography>Loading...</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="value" />
                      <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                      <Legend />
                      <Bar dataKey="accuracyPercentage" name="Accuracy" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </>
          )}

          {view === 'table' && !loading && <UsersTable stats={userStats} surveys={surveys} />}
        </Box>
      </CardContent>
    </Card>
  );
};

export default UserStats;
