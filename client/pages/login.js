/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Logo, Header, Text, Link } from '@components';

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
    maxWidth: 450,
    margin: 'auto',
    '& a': {
      borderColor: 'transparent',
    },
  },
  card: {
    background: theme.brand.white,
    borderRadius: 8,
    boxShadow: '0 3px 10px rgba(50, 50, 93, .11), 0 1px 2px rgba(0, 0, 0, .08)',
    padding: '40px',
  },
  logoContainer: {
    '&:hover': {
      borderColor: 'transparent',
    },
    '& .logo': {
      width: 80,
      marginBottom: theme.spacing.unit,
    },
  },
  header: {
    fontSize: '1.6rem',
  },
  subHeader: {
    marginBottom: theme.spacing.unit * 4,
  },
  footerContainer: {
    display: 'flex',
    marginTop: theme.spacing.unit * 2,
  },
  moreContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: `${theme.spacing.unit * 2}px 0`,
    '& a': {
      fontSize: '0.9rem',
      color: theme.palette.secondary.main,
    },
  },
  moreRight: {
    '& a': {
      marginRight: theme.spacing.unit * 2,
    },
    '& a:last-child': {
      marginRight: 0,
    },
  },
});

function Login(props) {
  const { classes } = props;
  return (
    <main className={classes.page}>
      <section className={classes.container}>
        <div className={classes.card}>
          <Link href="/" className={classes.logoContainer}>
            <Logo />
          </Link>
          <Header className={classes.header}>Welcome back</Header>
          <Text className={classes.subHeader}>Log into your account</Text>
          <LoginForm />
          <footer className={classes.footerContainer}>
            <Link href="/forgot_password">Forgot your password?</Link>
          </footer>
        </div>
        <div className={classes.moreContainer}>
          <Link href="/signup">Create Account</Link>
          <div className={classes.moreRight}>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

Login.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Login);
