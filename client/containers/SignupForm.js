import React, { PureComponent } from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { withStyles } from '@material-ui/core/styles';
import { withApollo } from 'react-apollo';
import { adopt } from 'react-adopt';

import redirect from '@utils/redirect';

import Signup from '@containers/auth/Signup';
import { FormField, Button, Snackbar } from '@components';

const styles = (theme) => ({
  field: { marginBottom: theme.spacing(2) },
});

const validationSchema = Yup.object().shape({
  username: Yup.string().required('This will be how people find you'),
  email: Yup.string()
    .email('That doesn’t seem right')
    .required('This is how you log in'),
  password: Yup.string()
    .min(6, 'Just a little longer')
    .required('Your password is required'),
});

const Composed = adopt({
  // eslint-disable-next-line react/prop-types
  signup: ({ render, onError, onCompleted }) => (
    <Signup onError={onError} onCompleted={onCompleted}>
      {(mutation, params) => render({ mutation, params })}
    </Signup>
  ),
  // eslint-disable-next-line react/prop-types
  formik: ({ render, signup }) => {
    return (
      <Formik
        initialValues={{
          username: '',
          email: '',
          password: '',
        }}
        validationSchema={validationSchema}
        onSubmit={(values) => signup.mutation({ variables: values })}
      >
        {render}
      </Formik>
    );
  },
});

class SignupForm extends PureComponent {
  state = {
    isErrorState: false,
  };

  closeErrorState = () => {
    this.setState({ isErrorState: false });
  };

  onSubmitError = () => {
    this.setState({ isErrorState: true });
  };

  onSubmitSuccess = async () => {
    // Force a reload of all the current queries now that the user is
    // logged in.
    const { client } = this.props;
    await client.resetStore();
    redirect({}, '/');
  };

  renderForm = ({ formik, signup }) => {
    const { loading, error } = signup.params;
    const { isErrorState } = this.state;
    const { classes } = this.props;
    return (
      <>
        <Snackbar
          open={isErrorState}
          variant="error"
          message={error && error.message}
          onClose={this.closeErrorState}
        />
        <form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
          <FormField
            id="username"
            className={classes.field}
            label="Username"
            value={formik.values.username}
            formikProps={formik}
          />
          <FormField
            id="email"
            className={classes.field}
            label="Email"
            value={formik.values.email}
            formikProps={formik}
          />
          <FormField
            id="password"
            className={classes.field}
            label="Password"
            value={formik.values.password}
            formikProps={formik}
            type="password"
          />
          <footer className={classes.footer}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              isLoading={loading}
            >
              Sign Up
            </Button>
          </footer>
        </form>
      </>
    );
  };

  render() {
    return (
      <Composed onError={this.onSubmitError} onCompleted={this.onSubmitSuccess}>
        {this.renderForm}
      </Composed>
    );
  }
}

export default withStyles(styles)(withApollo(SignupForm));
