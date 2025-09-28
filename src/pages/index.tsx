import React from 'react';
import { Typography, Button, Container, Box } from '@mui/material';
import Head from 'next/head';
import TopNavBar from '@/components/ui/TopNavBar/TopNavBar';
import Link from 'next/link';
import { useAuthContext } from '@/components/contexts/AuthContext';
import heroImage from '/public/predigrowee-hero.png';

export default function Home() {
  const { isLoggedIn } = useAuthContext();
  return (
    <>
      <Head>
        <title>Predigrowee</title>
        <meta name="description" content="Predict the direction of facial growth" />
        <link rel="icon" href="" />
      </Head>
      <TopNavBar />
      <Box
        sx={{
          height: '94vh',
          backgroundImage: `url(${heroImage.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center',
              height: '80vh',
              textAlign: 'left',
              paddingLeft: '5%',
            }}
          >
            <Typography variant="h2" component="h1" gutterBottom>
              Predigrowee
            </Typography>
            <Typography variant="h5" component="h2" gutterBottom>
              Can you predict the direction of the facial growth?
            </Typography>
            <Link href={isLoggedIn ? '/quiz' : '/login'}>
              <Button variant="contained" color="primary" size="large" sx={{ mt: 4 }}>
                TRY IT!
              </Button>
            </Link>
          </Box>
        </Container>
      </Box>
    </>
  );
}
