import React from 'react';
import TextField from '@material-ui/core/TextField';

export default React.memo((props) => (
  <TextField variant="outlined" fullWidth {...props} />
));
