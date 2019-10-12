import React, { useState } from 'react';
import useForm from 'react-hook-form';
import { withStyles } from '@material-ui/core/styles';

import { emailValidation } from '@utils/validation';
import redirect from '@utils/redirect';

import { TextField, Button, Snackbar } from '@components';

const styles = (theme) => ({
  field: { marginBottom: theme.spacing(2) },
});

function SignupForm({ classes }) {
  const { register, errors, handleSubmit } = useForm({
    mode: 'onBlur',
  });
  const [signupState, setSignupState] = useState({
    isLoading: false,
    isErrorOpen: false,
    errorMessage: '',
  });

  const onSubmit = (data) => {
    console.log(data);
    setSignupState({
      isLoading: true,
      isErrorOpen: false,
      errorMessage: '',
    });
    setTimeout(() => {
      setSignupState({
        isLoading: false,
        isErrorOpen: true,
        errorMessage: 'Incorrect email',
      });
    }, 1000);
  };

  return (
    <>
      <Snackbar
        open={signupState.isErrorOpen}
        variant="error"
        message={signupState.errorMessage}
        onClose={() => setSignupState({ isErrorOpen: false, errorMessage: '' })}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField
          id="email"
          name="email"
          label="Email"
          className={classes.field}
          helperText={errors.email && "This email doesn't look right."}
          error={!!errors.email}
          inputRef={register({ required: true, pattern: emailValidation })}
        />
        <TextField
          id="password"
          name="password"
          type="password"
          label="Password"
          className={classes.field}
          helperText={errors.password && 'Password is required'}
          error={!!errors.password}
          inputRef={register({ required: true })}
        />
        <footer className={classes.footer}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            isLoading={signupState.isLoading}
          >
            Sign Up
          </Button>
        </footer>
      </form>
    </>
  );
}

export default withStyles(styles)(SignupForm);
