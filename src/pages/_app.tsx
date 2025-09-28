import React from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../theme';
import { AuthContextProvider } from '@/components/contexts/AuthContext';
import { QuizContextProvider } from '@/components/contexts/QuizContext';
import { AppProps } from 'next/app';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const quizPaths = ['/quiz', '/quiz/[sessionId]'];

export default function MyApp({ Component, pageProps, router }: AppProps) {
  const isQuizPage = quizPaths.some((path) => router.pathname === path);

  return (
    <React.Fragment>
      <Head>
        <title>Predigrowee</title>
        <meta name="description" content="Predict the direction of facial growth" />
        <link rel="icon" href="" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthContextProvider>
          {isQuizPage ? (
            <QuizContextProvider>
              <Component {...pageProps} />
              <ToastContainer />
            </QuizContextProvider>
          ) : (
            <>
              <Component {...pageProps} />
              <ToastContainer />
            </>
          )}
        </AuthContextProvider>
      </ThemeProvider>
    </React.Fragment>
  );
}

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  pageProps: PropTypes.object.isRequired,
};
