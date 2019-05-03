import React from 'react';
import Typography from '@material-ui/core/Typography';

const Text = ({ children, ...props }) => {
  return (
    <Typography component="p" variant="body1" {...props}>
      {children}
    </Typography>
  );
};

export default Text;
