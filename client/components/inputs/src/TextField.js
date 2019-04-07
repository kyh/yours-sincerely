import React from 'react';
import TextField from '@material-ui/core/TextField';
import { FormikTextField } from 'formik-material-fields';

export default ({ defaultField, ...props }) =>
  defaultField ? (
    <TextField variant="outlined" fullWidth {...props} />
  ) : (
    <FormikTextField variant="outlined" fullWidth {...props} />
  );
