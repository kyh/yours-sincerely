import React from 'react';
import { Header } from '@components';
import { withStyles } from '@material-ui/core/styles';

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

export default withStyles(styles)(ForgotPassword);
