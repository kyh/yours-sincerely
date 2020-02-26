// catch errors in our app and show the error screen instead of just breaking
// https://reactjs.org/docs/error-boundaries.html

import React from 'react';

import { Error } from './Error';

export class ErrorBoundary extends React.Component {
  state = {
    error: null
  };

  componentDidCatch(error, info) {
    this.setState({ error });
  }

  render() {
    if (this.state.error) {
      return <Error error={this.state.error} />;
    }

    return this.props.children;
  }
}
