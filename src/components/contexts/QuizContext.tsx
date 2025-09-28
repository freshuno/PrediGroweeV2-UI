import React from 'react';
import { QUIZ_SERVICE_URL } from '@/Envs';
import QuizClient from '@/Clients/QuizClient';

type QuizContextType = {
  sessionId: string;
  setSessionId: (sessionId: string) => void;
  quizClient: QuizClient;
};
const quizClient = new QuizClient(QUIZ_SERVICE_URL);

const QuizContext = React.createContext<QuizContextType>({
  sessionId: '',
  setSessionId: () => {},
  quizClient: quizClient,
});

const QuizContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [sessionId, setSessionId] = React.useState('');
  return (
    <QuizContext.Provider value={{ sessionId, setSessionId, quizClient }}>
      {children}
    </QuizContext.Provider>
  );
};

const useQuizContext = () => {
  const context = React.useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuizContext must be used within a QuizContextProvider');
  }
  return context;
};

export { QuizContextProvider, useQuizContext };
