import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import Navigation from '@client/containers/auth/Navigation';
import Feed from '@client/containers/home/Feed';
import Create from '@client/containers/home/Create';
import Pagination from '@client/containers/home/Pagination';

const styles = (theme) => ({
  container: {
    maxWidth: theme.brand.maxWidth,
    margin: 'auto',
    padding: `${theme.spacing.unit * 5}px ${theme.spacing.unit * 3}px`,
  },
  feed: {
    marginBottom: theme.spacing.unit * 3,
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
  },
});

function Home({ classes, page }) {
  return (
    <main className={classes.page}>
      <Navigation />
      <section className={classes.container}>
        <section className={classes.feed}>
          <Feed page={page} />
        </section>
        <section className={classes.create}>
          <Create />
        </section>
        <section className={classes.pagination}>
          <Pagination page={page} />
        </section>
      </section>
    </main>
  );
}

Home.getInitialProps = ({ query }) => {
  return { page: parseFloat(query.page) || 1 };
};

Home.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Home);
