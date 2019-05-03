/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';
import PropTypes from 'prop-types';
import { Header, Text, Link } from '@ysds';
import { withStyles } from '@material-ui/core/styles';
import Navigation from '@client/containers/auth/Navigation';

const styles = (theme) => ({
  page: {},
  pageContainer: {
    textAlign: 'center',
    paddingTop: theme.spacing.unit * 20,
  },
});

function About(props) {
  const { classes } = props;

  return (
    <main className={classes.page}>
      <Navigation />
      <section className={classes.pageContainer}>
        <Header>About Yours Sincerely</Header>
        <Text gutterBottom>about page</Text>
        <Link href="/">Go to the main page</Link>
      </section>
    </main>
  );
}

About.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(About);
