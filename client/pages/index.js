import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import { Navigation } from '@components';
import Feed from '@client/containers/home/Feed';
import Create from '@client/containers/home/Create';

const styles = (theme) => ({
  page: {
    textAlign: 'center',
  },
  container: {
    maxWidth: 1300,
    margin: 'auto',
    padding: '0 20px',
  },
  textContainer: {
    margin: 'auto',
  },
});

function Home({ classes }) {
  return (
    <main className={classes.page}>
      <Navigation />
      <section className={classes.container}>
        <Feed />
        <footer className={classes.textContainer}>
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
