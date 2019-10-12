import React from 'react';
import NProgress from 'nprogress';
import Router from 'next/router';
import { withStyles } from '@material-ui/core/styles';

import { useAuth } from '@hooks/auth';

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
    padding: `0 ${theme.spacing(3)}px`,
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${theme.spacing(3)}px 0`,
    '& a, & button': {
      marginRight: theme.spacing(3),
      border: 'none',
      '&:hover': {
        color: theme.palette.primary.dark,
      },
      '&:last-child': {
        marginRight: 0,
      },
    },
    '& .get-started': {
      padding: theme.spacing(1),
      border: `2px solid ${theme.palette.primary.main}`,
      borderRadius: 4,
      '&:hover': {
        borderColor: theme.palette.primary.dark,
      },
    },
  },
});

function Navigation({ classes }) {
  const [authState] = useAuth();
  console.log(authState);
  return (
    <section className={classes.container}>
      <nav className={classes.nav}>
        <Link href="/">
          <Logo />
        </Link>
        <div>
          <Link href="/login">Log in</Link>
          <Link className="get-started" href="/signup">
            Get Started
          </Link>
        </div>
      </nav>
    </section>
  );
}

export default withStyles(styles)(Navigation);
