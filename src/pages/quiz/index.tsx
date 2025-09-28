import React from 'react';
import QuizPage from './_components/QuizPage';
import StartQuiz from './_components/startQuiz';
import QuizResultsPage from './_components/results';
import { QuizState } from '@/types';

const QuizIndexPage = () => {
  const [quizState, setQuizState] = React.useState<QuizState>({
    step: 'start',
    sessionId: '',
    mode: 'educational',
    timeLimit: undefined,
  });
  switch (quizState.step) {
    case 'start':
      return (
        <StartQuiz
          nextStep={(sessionId: string, mode, timeLimit?: number) => {
            setQuizState({ step: 'quiz', sessionId: sessionId, mode: mode, timeLimit: timeLimit });
          }}
        />
      );
    case 'quiz':
      return (
        <QuizPage
          sessionId={quizState.sessionId}
          mode={quizState.mode}
          timeLimit={quizState?.timeLimit}
          nextStep={() => {
            setQuizState((state) => ({ ...state, step: 'results' }));
          }}
        />
      );
    case 'results':
      return (
        <QuizResultsPage
          sessionId={quizState.sessionId}
          newQuiz={() => {
            setQuizState({ step: 'start', sessionId: '', mode: 'educational' });
          }}
        />
      );
    default:
      return (
        <StartQuiz
          nextStep={(sessionId: string, mode, timeLimit?: number) => {
            setQuizState({ step: 'quiz', sessionId: sessionId, mode: mode, timeLimit: timeLimit });
          }}
        />
      );
  }
};
export default QuizIndexPage;
