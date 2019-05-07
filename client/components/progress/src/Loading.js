import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';

const styles = {
  loading: {
    animationDuration: '550ms',
  },
};

function Loading() {
  return (
    <CircularProgress
      variant="indeterminate"
      disableShrink
      size={24}
      thickness={4}
    />
  );
}

export default React.memo(Loading);
