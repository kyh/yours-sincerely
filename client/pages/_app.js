import React from 'react';
import App, { Container } from 'next/app';

// Connect Apollo
import { ApolloProvider } from 'react-apollo';
import withApollo from '@client/utils/with-apollo';

// Connect UI Theme
import { ThemeProvider } from '@material-ui/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import theme from '@client/utils/theme';

class YSApp extends App {
  componentDidMount() {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentNode.removeChild(jssStyles);
    }
  }

  render() {
    const { Component, pageProps, apollo } = this.props;
    return (
      <Container>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ApolloProvider client={apollo}>
            <Component {...pageProps} />
          </ApolloProvider>
        </ThemeProvider>
      </Container>
    );
  }
}

export default withApollo(YSApp);
