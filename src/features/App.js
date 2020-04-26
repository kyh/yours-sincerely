import React from "react";
import { ThemeProvider } from "styled-components";
import { BrowserRouter } from "react-router-dom";

import { ErrorBoundary } from "./misc/ErrorBoundary";
import { Routes } from "./Routes";
import { GlobalStyle } from "styles/global";
import { lightTheme } from "styles/theme";

export const App = () => (
  <ThemeProvider theme={lightTheme}>
    <BrowserRouter>
      <GlobalStyle />
      <ErrorBoundary>
        <Routes />
      </ErrorBoundary>
    </BrowserRouter>
  </ThemeProvider>
);
