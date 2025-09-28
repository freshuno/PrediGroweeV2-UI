import TopNavBar from '@/components/ui/TopNavBar/TopNavBar';
import React from 'react';
import { Container, Typography, Card, CardContent, Grid, Box } from '@mui/material';
import { Security, Email, Google, Storage, Gavel } from '@mui/icons-material';
import axios from 'axios';

const iconMap = {
  Security,
  Email,
  Google,
  Storage,
  Gavel,
};

type Section = {
  title: string;
  icon: keyof typeof iconMap;
  content: string[];
};

type Props = {
  sections: Section[];
};

export async function getServerSideProps() {
  const res = await axios.get('http://frontend:3000/api/content/privacy');
  const data = await res.data;

  return {
    props: {
      sections: data.content.sections,
    },
  };
}

export default function Privacy({ sections }: Props) {
  return (
    <>
      <TopNavBar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 6 }}>
          Privacy Policy
        </Typography>

        <Grid container spacing={3}>
          {sections.map((section, index) => {
            const Icon = iconMap[section.icon];
            return (
              <Grid item xs={12} md={6} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: (theme) => theme.shadows[4],
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                      {Icon && <Icon />}
                      <Typography variant="h6" component="h2">
                        {section.title}
                      </Typography>
                    </Box>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                      {section.content.map((item, idx) => (
                        <li key={idx}>
                          <Typography variant="body1" color="text.secondary" paragraph>
                            {item}
                          </Typography>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </>
  );
}
