import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import { Navigation } from '@components';
import Feed from '@client/containers/home/Feed';
import Create from '@client/containers/home/Create';

const styles = (theme) => ({
  container: {
    maxWidth: theme.brand.maxWidth,
    margin: 'auto',
    padding: `${theme.spacing.unit * 5}px ${theme.spacing.unit * 3}px`,
  },
  feed: {
    marginBottom: theme.spacing.unit * 3,
  },
});

function Home({ classes }) {
  return (
    <main className={classes.page}>
      <Navigation />
      <section className={classes.container}>
        <section className={classes.feed}>
          <Feed />
        </section>
        <footer className={classes.create}>
          <Create />
        </footer>
      </section>
    </main>
  );
}

Home.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Home);
