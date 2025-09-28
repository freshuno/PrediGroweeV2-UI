import React from 'react';
import { Box, Button, Card, IconButton, Stack, Typography } from '@mui/material';
import TopNavBar from '@/components/ui/TopNavBar/TopNavBar';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QuestionsTable from '@/pages/admin/questions/_components/Questions/QuestionsTable';
import ParametersTable from '@/pages/admin/questions/_components/Parameters/ParametersTable';
import OptionsManagement from '@/pages/admin/questions/_components/Options/OptionsManagement';

type Tab = 'questions' | 'options' | 'cases' | 'parameters';
const Tabs = ['questions', 'options', 'parameters'] as const;

const AdminQuestionsPanel = () => {
  const [activeTab, setActiveTab] = React.useState<Tab>('questions');
  const renderContent = () => {
    switch (activeTab) {
      case 'questions':
        return <QuestionsTable />;
      case 'cases':
        return <></>;
      case 'parameters':
        return <ParametersTable />;
      case 'options':
        return <OptionsManagement />;
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
          Questions Management
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

export default AdminQuestionsPanel;
