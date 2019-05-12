/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Logo, Header, Link, Card } from '@components';

import SignupForm from '@client/containers/auth/SignupForm';

const styles = (theme) => ({
  page: {
    display: 'flex',
    height: '100vh',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: theme.spacing.unit * 4,
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

function Signup(props) {
  const { classes } = props;
  return (
    <main className={classes.page}>
      <section className={classes.container}>
        <Card className={classes.card}>
          <Link href="/" className={classes.logoContainer}>
            <Logo />
          </Link>
          <Header className={classes.header}>Create your account</Header>
          <SignupForm />
        </Card>
        <div className={classes.moreContainer}>
          <Link href="/login">Log in instead</Link>
          <div className={classes.moreRight}>
            <Link href="/about">About</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

Signup.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Signup);
