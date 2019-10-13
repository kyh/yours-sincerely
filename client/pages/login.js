import React from 'react';
import { withStyles } from '@material-ui/core/styles';

import AuthForm from '@containers/AuthForm';
import { Logo, Header, Text, Link, Card } from '@components';

const styles = (theme) => ({
  page: {
    textAlign: 'center',
    '@media (min-width: 450px)': {
      display: 'flex',
      height: '100vh',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.brand.background,
      padding: 0,
    },
  },
  container: {
    maxWidth: 450,
    margin: 'auto',
    '& a': {
      borderColor: 'transparent',
    },
  },
  card: {
    padding: theme.spacing(2),
    boxShadow: 'none',
    '@media (min-width: 450px)': {
      boxShadow: theme.brand.boxShadow,
      padding: '40px',
      borderRadius: 8,
    },
  },
  logoContainer: {
    '&:hover': {
      borderColor: 'transparent',
    },
    '& .logo': {
      width: 80,
      marginBottom: theme.spacing(1),
    },
  },
  header: {
    fontSize: '1.6rem',
  },
  subHeader: {
    marginBottom: theme.spacing(4),
  },
  footerContainer: {
    display: 'flex',
    marginTop: theme.spacing(2),
  },
  moreContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: `${theme.spacing(2)}px`,
    '& a': {
      fontSize: '0.9rem',
      color: theme.palette.secondary.main,
    },
    '@media (min-width: 450px)': {
      paddingLeft: 0,
      paddingRight: 0,
    },
  },
  moreRight: {
    '& a': {
      marginRight: theme.spacing(2),
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
          <AuthForm isLoginForm />
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

export default withStyles(styles)(Login);
