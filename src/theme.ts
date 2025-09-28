import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

const theme = createTheme({
  palette: {
    primary: {
      main: '#002eff',
    },
    secondary: {
      main: '#19857b',
    },
    background: {
      default: '#b3afaf',
      paper: `#f5f5f5`,
    },
    error: {
      main: red.A400,
    },
  },
});

export default theme;
