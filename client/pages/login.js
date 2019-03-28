/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Header } from '@components';

import LoginForm from '@client/containers/auth/LoginForm';

const styles = (theme) => ({
  page: {
    display: 'flex',
    height: '100vh',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: theme.brand.background,
  },
  container: {
    background: theme.brand.white,
    maxWidth: 450,
    margin: 'auto',
    borderRadius: 8,
    boxShadow: '0 3px 10px rgba(50, 50, 93, .11), 0 1px 2px rgba(0, 0, 0, .08)',
    padding: '48px 40px',
    transform: 'translateY(-30px)',
  },
});

function Login(props) {
  const { classes } = props;

  return (
    <main className={classes.page}>
      <section className={classes.container}>
        <Header>Login</Header>
        <LoginForm />
      </section>
    </main>
  );
}

Login.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Login);
