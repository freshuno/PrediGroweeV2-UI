type UserSurvey = {
  userId?: number;
  name: string;
  surname: string;
  gender: string;
  age: number;
  country: string;
  visionDefect: string;
  education: string;
  experience: string;
  acknowledgements: boolean;
};

type UserData = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  googleId?: string;
};
type UserRole = 'admin' | 'user' | 'teacher';

export type { UserData };

type Parameter = {
  id: number;
  name: string;
  description: string;
  referenceValues: string;
  order: number;
};
type ParameterValue = {
  id: number;
  value1: number;
  value2: number;
  value3: number;
};
type QuestionCase = {
  id: number;
  code: string;
  gender: string;
  age1: number;
  age2: number;
  age3: number;
  parameters: Parameter[];
  parametersValues: ParameterValue[];
};
type UserQuizStats = {
  userId: number;
  totalAnswers: number;
  correctAnswers: number;
};

type QuestionData = {
  id: number;
  question: string;
  options: string[];
  predictionAge: number;
  case: QuestionCase;
  correct: string;
  group: number;
};
type QuizMode = 'educational' | 'time_limited' | 'classic' | 'timeLimited';

type QuestionOption = {
  id: number;
  option: string;
  questions?: number;
};

type UserStats = {
  accuracy: Record<QuizMode, number>;
  correctAnswers: Record<QuizMode, number>;
  totalQuestions: Record<QuizMode, number>;
};

type ResponseData = {
  id: number;
  userId: number;
  caseCode: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
  time: string;
  screenSize: string;
  timeSpent: number;
};
type QuestionStats = {
  questionId: number;
  total: number;
  correct: number;
};
type ActivityData = {
  date: string;
  total: number;
  correct: number;
};

const QUIZ_MODES: QuizMode[] = ['educational', 'time_limited', 'classic'];
type QuizState = {
  sessionId: string;
  step: 'start' | 'quiz' | 'results';
  mode: QuizMode;
  timeLimit?: number;
};

type UserDetails = {
  user: UserData;
  stats: UserStats;
  survey: UserSurvey;
};

type QuizSummary = {
  questions: number;
  activeSurveys: number;
};
type StatsSummary = {
  quizSessions: number;
  totalResponses: number;
  totalCorrect: number;
};

type AuthSummary = {
  users: number;
  activeUsers: number;
  lastRegistered: number;
};

type DashboardSummary = {
  quizSummary: QuizSummary;
  statsSummary: StatsSummary;
  authSummary: AuthSummary;
};

export type QuestionResult = {
  questionId: string;
  answer: string;
  isCorrect: boolean;
};

type QuizResults = {
  sessionId: number;
  mode: string;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  questions: QuestionResult[];
  startTime: string;
};

type SurveyGroupedStats = {
  group: string;
  value: string;
  total: number;
  correct: number;
  accuracy: number;
};
export type Settings = {
  name: string;
  value: string;
};

export type {
  UserSurvey,
  Parameter,
  ParameterValue,
  QuestionCase,
  QuestionData,
  QuizState,
  QuizMode,
  UserStats,
  UserDetails,
  UserRole,
  QuestionOption,
  ResponseData,
  QuestionStats,
  ActivityData,
  DashboardSummary,
  QuizResults,
  SurveyGroupedStats,
  UserQuizStats,
};
export { QUIZ_MODES };
