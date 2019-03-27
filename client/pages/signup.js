/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';
import PropTypes from 'prop-types';
import { Header, Text } from '@components';
import { withStyles } from '@material-ui/core/styles';
import Link from 'next/link';

const styles = (theme) => ({
  root: {
    textAlign: 'center',
    paddingTop: theme.spacing.unit * 20,
  },
});

function Signup(props) {
  const { classes } = props;

  return (
    <div className={classes.root}>
      <Header>Signup</Header>
      <Text>No option to sign up yet</Text>
      <Text gutterBottom>
        <Link href="/login">
          <a>Go to login</a>
        </Link>
      </Text>
    </div>
  );
}

Signup.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Signup);
