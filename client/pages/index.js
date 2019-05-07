import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import Navigation from '@client/containers/auth/Navigation';
import HomeContent from '@client/containers/home/HomeContent';

const styles = (theme) => ({});

function Home({ classes, currentPage }) {
  return (
    <main className={classes.page}>
      <Navigation />
      <HomeContent currentPage={currentPage} />
    </main>
  );
}

Home.getInitialProps = ({ query }) => {
  return { currentPage: parseFloat(query.page) };
};

Home.propTypes = {
  classes: PropTypes.object.isRequired,
  currentPage: PropTypes.number.isRequired,
};

export default withStyles(styles)(Home);
