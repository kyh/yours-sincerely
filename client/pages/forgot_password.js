/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';
import PropTypes from 'prop-types';
import { Header, Text } from '@ysds';
import { withStyles } from '@material-ui/core/styles';
import Link from 'next/link';

const styles = (theme) => ({
  root: {
    textAlign: 'center',
    paddingTop: theme.spacing.unit * 20,
  },
});

function ForgotPassword(props) {
  const { classes } = props;

  return (
    <div className={classes.root}>
      <Header>Forgot Password</Header>
    </div>
  );
}

ForgotPassword.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ForgotPassword);
