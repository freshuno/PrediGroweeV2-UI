import { Stack, Typography, Box } from '@mui/material';
import React from 'react';
import { UserStats } from '@/types';

type UserStatsProps = {
  stats: UserStats;
};

const UserStatsSection = ({ stats }: UserStatsProps) => {
  if (!stats) return null;
  return (
    <Stack direction={{ md: 'row', xs: 'column' }} gap={2}>
      <Box>
        <Typography variant="h6">Classic</Typography>
        <Typography>Total Questions: {stats.totalQuestions.classic}</Typography>
        <Typography>Correct Answers: {stats.correctAnswers.classic}</Typography>
        <Typography>Accuracy: {stats.accuracy.classic * 100}%</Typography>
      </Box>
      <Box>
        <Typography variant="h6">time limited mode</Typography>
        <Typography>Total Questions: {stats.totalQuestions.timeLimited}</Typography>
        <Typography>Correct Answers: {stats.correctAnswers.timeLimited}</Typography>
        <Typography>Accuracy: {stats.accuracy.timeLimited * 100}%</Typography>
      </Box>
      <Box>
        <Typography variant="h6">Educational mode</Typography>
        <Typography>Total Questions: {stats.totalQuestions.educational}</Typography>
        <Typography>Correct Answers: {stats.correctAnswers.educational}</Typography>
        <Typography>Accuracy: {stats.accuracy.educational * 100}%</Typography>
      </Box>
    </Stack>
  );
};

export default UserStatsSection;
