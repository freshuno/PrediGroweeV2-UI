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
import { Box, useTheme, useMediaQuery } from '@mui/material';

type ActivityChartProps = {
  data: ActivityData[];
};

const ActivityChart = ({ data }: ActivityChartProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!data?.length) {
    return null;
  }

  const processedData = data.map((item) => {
    const dateObj = new Date(item.date);
    const shortDate = `${dateObj.getDate().toString().padStart(2, '0')}.${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;

    return {
      ...item,
      date: shortDate,
      fullDate: dateObj.toLocaleDateString(),
      incorrect: item.total - item.correct,
    };
  });

  return (
    <Box sx={{ width: '100%', height: { xs: 300, sm: 400, md: 450 } }}>
      <ResponsiveContainer>
        <BarChart
          data={processedData}
          margin={{
            top: 20,
            right: isMobile ? 0 : 30,
            left: isMobile ? -20 : 20,
            bottom: 40,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: isMobile ? 10 : 12 }}
            interval={isMobile ? 'preserveStartEnd' : 0}
          />
          <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 30 : 40} />
          <Tooltip
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                return payload[0].payload.fullDate;
              }
              return label;
            }}
          />
          <Legend wrapperStyle={{ fontSize: isMobile ? '12px' : '14px' }} />
          <Bar dataKey="correct" stackId="a" fill="#4CAF50" name="Correct" />
          <Bar dataKey="incorrect" stackId="a" fill="#FF5252" name="Incorrect" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default ActivityChart;
