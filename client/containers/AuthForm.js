import React, { useState } from 'react';
import useForm from 'react-hook-form';
import { withStyles } from '@material-ui/core/styles';

import { emailValidation } from '@utils/validation';
import firebase from '@utils/firebase';
import redirect from '@utils/redirect';

import { TextField, Button, Snackbar } from '@components';

const styles = (theme) => ({
  field: { marginBottom: theme.spacing(2) },
});

const FIREBASE_METHODS = {
  signup: 'createUserWithEmailAndPassword',
  login: 'signInWithEmailAndPassword',
};

function AuthForm({ isLoginForm, classes }) {
  const { register, errors, handleSubmit } = useForm({
    mode: 'onBlur',
  });
  const [loginState, setLoginState] = useState({
    isLoading: false,
    isErrorOpen: false,
    errorMessage: '',
  });

  const onSubmit = (data) => {
    const fbAuth = firebase.auth();
    const fbMethodName = isLoginForm
      ? FIREBASE_METHODS.login
      : FIREBASE_METHODS.signup;

    setLoginState({
      isLoading: true,
      isErrorOpen: false,
      errorMessage: '',
    });

    fbAuth[fbMethodName](data.email, data.password)
      .then(() => {
        redirect({}, '/');
      })
      .catch((error) => {
        setLoginState({
          isLoading: false,
          isErrorOpen: true,
          errorMessage: error.message,
        });
      });
  };

  return (
    <>
      <Snackbar
        open={loginState.isErrorOpen}
        variant="error"
        message={loginState.errorMessage}
        onClose={() => setLoginState({ isErrorOpen: false, errorMessage: '' })}
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
            isLoading={loginState.isLoading}
          >
            {isLoginForm ? 'Login' : 'Sign Up'}
          </Button>
        </footer>
      </form>
    </>
  );
}

export default withStyles(styles)(AuthForm);
