import TopNavBar from '@/components/ui/TopNavBar/TopNavBar';
import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import axios from 'axios';

type ContactContent = {
  title: string;
  subtitle: string;
  content: string;
};

type ContactProps = {
  content: ContactContent;
};

export default function Contact({ content }: ContactProps) {
  return (
    <>
      <TopNavBar />
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="h2" fontWeight="bold" gutterBottom>
            {content.title}
          </Typography>

          <Typography variant="h5" color="text.secondary" gutterBottom>
            {content.subtitle}
          </Typography>

          <Typography variant="h6" fontWeight="bold" sx={{ px: 5 }}>
            {content.content.split('\n').map((text, i) => (
              <React.Fragment key={i}>
                {text}
                <br />
              </React.Fragment>
            ))}
          </Typography>
        </Box>
      </Container>
    </>
  );
}

export async function getServerSideProps() {
  const res = await axios.get('http://frontend:3000/api/content/contact', {
    withCredentials: true,
  });
  const { content } = await res.data;

  return {
    props: {
      content,
    },
  };
}
