/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import App from 'next/app';

// Connect Apollo
import { ApolloProvider } from '@apollo/react-hooks';
import withApolloClient from '@client/utils/withApolloClient';

// Connect UI Theme
import { ThemeProvider } from '@material-ui/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import theme from '@client/utils/theme';

class IntApp extends App {
  componentDidMount() {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentNode.removeChild(jssStyles);
    }
  }

  render() {
    const { Component, pageProps, apolloClient } = this.props;
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ApolloProvider client={apolloClient}>
          <Component {...pageProps} />
        </ApolloProvider>
      </ThemeProvider>
    );
  }
}

export default withApolloClient(IntApp);
