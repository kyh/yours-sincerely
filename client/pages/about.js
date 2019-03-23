/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';
import PropTypes from 'prop-types';
import { Button, Header, Text } from '@components';
import { withStyles } from '@material-ui/core/styles';
import Link from 'next/link';

const styles = (theme) => ({
  root: {
    textAlign: 'center',
    paddingTop: theme.spacing.unit * 20,
  },
});

function About(props) {
  const { classes } = props;

  return (
    <div className={classes.root}>
      <Header>Sincerely Yours</Header>
      <Text variant="subtitle1" gutterBottom>
        about page
      </Text>
      <Text gutterBottom>
        <Link href="/">
          <a>Go to the main page</a>
        </Link>
      </Text>
      <Button variant="contained" color="primary">
        Do nothing button
      </Button>
    </div>
  );
}

About.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(About);
