import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';

const styles = {
  loading: {
    animationDuration: '550ms',
  },
};

function Loading({ classes }) {
  return (
    <CircularProgress
      variant="indeterminate"
      disableShrink
      className={classes.loading}
      size={24}
      thickness={4}
    />
  );
}

export default withStyles(styles)(Loading);
