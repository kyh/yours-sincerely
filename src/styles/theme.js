import { memoize } from 'lodash';

const SPACING_UNIT = 4;
const calculateSpacing = n => {
  return `${n * SPACING_UNIT}px`;
};

const colors = {
  black: '#292C36',
  white: '#FFFFFF',
  background: '#f5f8fa',
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
  backgroundRed: '',
  lightRed: '',
  red: '',
  darkRed: '',
  backgroundYellow: '',
  lightYellow: '',
  yellow: '',
  darkYellow: '',
  backgroundOrange: '',
  lightOrange: '',
  orange: '',
  darkOrange: ''
};

export const lightTheme = {
  colors,
  typography: {
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 700
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 700
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 700
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 700
    }
  },
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  spacings: memoize(calculateSpacing),
  ui: {
    maxWidth: '786px',
    text: colors.black,
    background: colors.background,
    border: '#3b475f1a',
    card: {
      shadow: '0 3px 10px rgba(50, 50, 93, .11), 0 1px 2px rgba(0, 0, 0, .08)'
    },
    button: {
      color: colors.white,
      fontWeight: 600,
      background: colors.primary,
      shadow: '0 0 10px 0 rgba(131, 137, 225, 0.4);',
      hover: {
        shadow: '0 0 2px 0 rgba(131, 137, 225, 0.4);',
        background: '#6e75da'
      },
      active: {}
    },
    modal: {
      backdrop: 'rgba(59, 71, 95, 0.85)'
    }
  }
};

export const darkTheme = {
  ...lightTheme,
  ui: {
    text: colors.white,
    background: colors.black,
    card: {
      border: colors.lightGrey
    },
    button: {
      color: colors.white,
      background: colors.black,
      border: colors.lightGrey
    },
    modal: {
      border: colors.lightGrey,
      background: colors.black
    }
  }
};
