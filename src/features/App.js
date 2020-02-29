import React from 'react';
import firebase from 'firebase/app';
import { ThemeProvider } from 'styled-components';
import { FirestoreProvider } from 'react-firestore';
import { BrowserRouter } from 'react-router-dom';

import { ErrorBoundary } from './misc/ErrorBoundary';
import { Routes } from './Routes';
import { GlobalStyle } from 'styles/global';
import { lightTheme } from 'styles/theme';

export const App = () => (
  <ThemeProvider theme={lightTheme}>
    <FirestoreProvider firebase={firebase}>
      <BrowserRouter>
        <GlobalStyle />
        <ErrorBoundary>
          <Routes />
        </ErrorBoundary>
      </BrowserRouter>
    </FirestoreProvider>
  </ThemeProvider>
);
