/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Logo, Header, Text, Link, Card } from '@components';

import AuthForm from '@client/containers/auth/AuthForm';

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
    borderRadius: 8,
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
        <Card className={classes.card}>
          <Link href="/" className={classes.logoContainer}>
            <Logo />
          </Link>
          <Header className={classes.header}>Welcome back</Header>
          <Text className={classes.subHeader}>Log into your account</Text>
          <AuthForm />
          <footer className={classes.footerContainer}>
            <Link href="/forgot_password">Forgot your password?</Link>
          </footer>
        </Card>
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
