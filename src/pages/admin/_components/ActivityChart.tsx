import React from 'react';
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
import { ActivityData } from '@/types';
import { Box } from '@mui/material';

type ActivityChartProps = {
  data: ActivityData[];
};

const ActivityChart = ({ data }: ActivityChartProps) => {
  if (!data?.length) {
    return null;
  }

  const processedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString(),
    incorrect: item.total - item.correct,
  }));

  return (
    <Box sx={{ width: '100%', height: '400px' }}>
      <ResponsiveContainer>
        <BarChart
          data={processedData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="correct" stackId="a" fill="#4CAF50" name="Correct" />
          <Bar dataKey="incorrect" stackId="a" fill="#FF5252" name="Incorrect" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default ActivityChart;
