import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Header } from '@components';

const styles = (theme) => ({
  root: {
    textAlign: 'center',
    paddingTop: theme.spacing(20),
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
