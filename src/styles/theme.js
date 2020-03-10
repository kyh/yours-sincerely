import { css } from 'styled-components';
import { memoize } from 'lodash';

const SPACING_UNIT = 4;
const calculateSpacing = n => {
  return `${n * SPACING_UNIT}px`;
};

const colors = {
  black: '#292C36',
  white: '#FFFFFF',
  background: '#F7FAFC',
  primary: '#8389E1',
  secondary: '#3B475F',
  backgroundBlue: '#EBF8FF',
  lightBlue: '#90CDF4',
  blue: '#4299E1',
  darkBlue: '#2B6CB0',
  backgroundGreen: '#F0FFF4',
  lightGreen: '#9AE6B4',
  green: '#48BB78',
  darkGreen: '#2F855A',
  backgroundRed: '#FFF5F5',
  lightRed: '#FEB2B2',
  red: '#F56565',
  darkRed: '#C53030',
  backgroundYellow: '#FFFFF0',
  lightYellow: '#FAF089',
  yellow: '#ECC94B',
  darkYellow: '#B7791F',
  backgroundOrange: '#FFFAF0',
  lightOrange: '#FBD38D',
  orange: '#ED8936',
  darkOrange: '#C05621',
  backgroundGrey: '#F7FAFC',
  lightGrey: '#E2E8F0',
  grey: '#A0AEC0',
  darkGrey: '#4A5568'
};

const breakpointsMap = {
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200
};

const breakpoints = Object.keys(breakpointsMap).reduce((acc, label) => {
  acc[label] = (...args) => css`
    @media (max-width: ${breakpointsMap[label]}px) {
      ${css(...args)};
    }
  `;
  return acc;
}, {});

export const lightTheme = {
  colors,
  breakpoints,
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
    },
    post: {
      fontSize: '1.2rem',
      lineHeight: '32px'
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
      fontWeight: 400,
      background: colors.primary,
      shadow: '0 0 10px 0 rgba(131, 137, 225, 0.4);',
      hover: {
        shadow: '0 0 2px 0 rgba(131, 137, 225, 0.4);',
        background: '#6e75da'
      },
      disabled: {
        background: colors.lightGrey,
        shadow: 'none'
      }
    },
    modal: {
      background: colors.white
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
