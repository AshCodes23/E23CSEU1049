import { createTheme } from '@mui/material/styles';

/**
 * Custom Material UI theme for the Campus Notification Platform.
 * Uses a dark color scheme with accent colors for notification types.
 */
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6C63FF',
      light: '#8B83FF',
      dark: '#4A42CC',
    },
    secondary: {
      main: '#00D9A6',
      light: '#33E0B8',
      dark: '#00AD85',
    },
    background: {
      default: '#0A0E1A',
      paper: '#111827',
    },
    error: {
      main: '#FF6B6B',
    },
    warning: {
      main: '#FFB347',
    },
    success: {
      main: '#00D9A6',
    },
    info: {
      main: '#6C63FF',
    },
    text: {
      primary: '#E8EAED',
      secondary: '#9AA0A6',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
          border: '1px solid rgba(108, 99, 255, 0.15)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.75rem',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;
