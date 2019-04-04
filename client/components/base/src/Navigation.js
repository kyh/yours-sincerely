import React from 'react';
import NProgress from 'nprogress';
import Router from 'next/router';
import { withStyles } from '@material-ui/core/styles';
import { Logo, Link } from '@components';

Router.onRouteChangeStart = () => {
  NProgress.start();
};
Router.onRouteChangeComplete = () => {
  NProgress.done();
};

Router.onRouteChangeError = () => {
  NProgress.done();
};

const styles = (theme) => ({
  container: {
    maxWidth: theme.brand.maxWidth,
    margin: '0 auto',
    padding: `0 ${theme.spacing.unit * 3}px`,
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${theme.spacing.unit * 3}px 0`,
    '& a': {
      marginRight: theme.spacing.unit * 3,
      border: 'none',
      '&:hover': {
        color: theme.palette.primary.dark,
      },
      '&:last-child': {
        marginRight: 0,
      },
    },
  },
});

function Navigation({ classes }) {
  return (
    <section className={classes.container}>
      <nav className={classes.nav}>
        <Link href="/">
          <Logo />
        </Link>
        <div>
          <Link href="/about">About</Link>
          <Link href="/login">Login</Link>
        </div>
      </nav>
    </section>
  );
}

export default withStyles(styles)(Navigation);
