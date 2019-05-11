import React from 'react';
import { configure, addDecorator, addParameters } from '@storybook/react';
import { create } from '@storybook/theming';

import { withKnobs } from '@storybook/addon-knobs';
import { withNotes } from '@storybook/addon-notes';
import { withA11y } from '@storybook/addon-a11y';
import { withConsole } from '@storybook/addon-console';

import { MuiThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import theme from '@client/utils/theme';

// Storyboard decorators.
addDecorator(withNotes);
addDecorator(withKnobs);
addDecorator(withA11y);
addDecorator((story) => (
  <MuiThemeProvider theme={theme}>
    <CssBaseline />
    <main style={{ padding: 20 }}>{story()}</main>
  </MuiThemeProvider>
));

addParameters({
  options: {
    theme: create({
      base: 'light',
      colorPrimary: '#8389E1',
      colorSecondary: '#3B475F',
      appBg: '#f6f8fd',
      appContentBg: 'white',
      appBorderRadius: 5,
      brandTitle: 'Yours Sincerely',
      brandImage: 'https://yourssincerely.org/static/assets/logo.svg',
    }),
    panelPosition: 'right',
  },
});

const req = require.context('../client', true, /[\w\d\s]+\.stories.js$/);

const loadStories = () => {
  req.keys().forEach((key) => {
    req(key);
  });
};

configure(loadStories, module);
