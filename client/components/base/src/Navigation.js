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

const styles = {
  container: {
    display: 'flex',
  },
};

function Navigation({ classes }) {
  return (
    <nav className={classes.container}>
      <Link href="/">
        <Logo />
      </Link>
      <Link href="/about">About</Link>
      <Link href="/login">Login</Link>
    </nav>
  );
}

export default withStyles(styles)(Navigation);
