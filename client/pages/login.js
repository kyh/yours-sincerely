/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import { withStyles } from '@material-ui/core/styles';
import { Header, Text } from '@components';

import LoginForm from '@client/containers/auth/LoginForm';

const styles = (theme) => ({
  root: {
    textAlign: 'center',
    paddingTop: theme.spacing.unit * 20,
  },
});

function Login(props) {
  const { classes } = props;

  return (
    <div className={classes.root}>
      <Header>Login</Header>
      <LoginForm />
      <Text gutterBottom>
        <Link href="/">
          <a>Go to signup</a>
        </Link>
      </Text>
    </div>
  );
}

Login.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Login);
