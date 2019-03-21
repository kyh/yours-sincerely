import React from 'react';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

const theme = createMuiTheme({
  palette: {
    primary: {
      // light: will be calculated from palette.primary.main,
      main: '#8389E1',
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    secondary: {
      // light: will be calculated from palette.secondary.main,
      main: '#3B475F',
      // dark: will be calculated from palette.secondary.main,
      // contrastText: will be calculated to contrast with palette.secondary.main
    },
    // error: will use the default color
    background: {
      default: '#FFFFFF',
    },
  },
  brand: {
    black: '#292C36',
    white: '#FFFFFF',
    backgroundGrey: '#F6F8FD',
    primary: '#8389E1',
    secondary: '#3B475F',
    backgroundBlue: '#C5EBFF',
    lightBlue: '#2B9DD6',
    blue: '#007AFF',
    darkBlue: '#005E8C',
    backgroundGreen: '#D6FCEE',
    lightGreen: '#1FA67A',
    green: '#12855F',
    darkGreen: '#006647',
    backgroundYellow: '',
    lightYellow: '',
    yellow: '',
    darkYellow: '',
    backgroundOrange: '',
    lightOrange: '',
    Orange: '',
    darkOrange: '',
  },
  typography: {
    useNextVariants: true,
    // Use the system font instead of the default Roboto font.
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    subtitle1: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.57,
      letterSpacing: '0.00714em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
    overline: {
      fontWeight: 700,
    },
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 700,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 700,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 700,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 700,
    },
  },
  overrides: {
    MuiButton: {
      contained: {
        boxShadow: '0 0 10px 0 rgba(224, 224, 224, 0.4);',
        '&:active': {
          boxShadow: '0 0 2px 0 rgba(224, 224, 224, 0.4);',
        },
      },
      containedPrimary: {
        boxShadow: '0 0 10px 0 rgba(131, 137, 225, 0.4);',
        '&:active': {
          boxShadow: '0 0 2px 0 rgba(131, 137, 225, 0.4);',
        },
      },
      containedSecondary: {
        boxShadow: '0 0 10px 0 rgba(57, 71, 97, 0.4);',
        '&:active': {
          boxShadow: '0 0 2px 0 rgba(57, 71, 97, 0.4);',
        },
      },
    },
    MuiFab: {
      root: {
        boxShadow: 'none',
        '&:active': {
          boxShadow: 'none',
        },
        '&$focusVisible': {
          boxShadow: 'none',
        },
      },
      primary: {
        boxShadow: '0 0 10px 0 rgba(131, 137, 225, 0.4);',
        '&:active': {
          boxShadow: '0 0 2px 0 rgba(131, 137, 225, 0.4);',
        },
      },
      secondary: {
        boxShadow: '0 0 10px 0 rgba(57, 71, 97, 0.4);',
        '&:active': {
          boxShadow: '0 0 2px 0 rgba(57, 71, 97, 0.4);',
        },
      },
    },
  },
});

export default function({ children }) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
