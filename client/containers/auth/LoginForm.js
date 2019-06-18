import React, { PureComponent } from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { withStyles } from '@material-ui/core/styles';
import { withApollo } from 'react-apollo';
import { adopt } from 'react-adopt';

import { FormField, Button, Snackbar } from '@components';
import Login from '@client/containers/auth/Login';
import redirect from '@client/utils/redirect';

const styles = (theme) => ({
  field: { marginBottom: theme.spacing(2) },
});

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('That doesn’t seem right')
    .required('That doesn’t seem right'),
  password: Yup.string()
    .min(6, 'Just a little longer')
    .required('That doesn’t seem right'),
});

const Composed = adopt({
  // eslint-disable-next-line react/prop-types
  login: ({ render, onError, onCompleted }) => (
    <Login onError={onError} onCompleted={onCompleted}>
      {(mutation, params) => render({ mutation, params })}
    </Login>
  ),
  // eslint-disable-next-line react/prop-types
  formik: ({ render, login }) => {
    return (
      <Formik
        initialValues={{
          email: '',
          password: '',
        }}
        validationSchema={validationSchema}
        onSubmit={(values) => login.mutation({ variables: values })}
      >
        {render}
      </Formik>
    );
  },
});

class LoginForm extends PureComponent {
  state = {
    isErrorState: false,
  };

  closeErrorState = () => {
    this.setState({ isErrorState: false });
  };

  onSubmitError = () => {
    this.setState({ isErrorState: true });
  };

  onSubmitSuccess = () => {
    const { client } = this.props;
    // Force a reload of all the current queries now that the user is
    // logged in
    client.cache.reset().then(() => {
      redirect({}, '/');
    });
  };

  renderForm = ({ formik, login }) => {
    const { loading, error } = login.params;
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
              Login
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

export default withStyles(styles)(withApollo(LoginForm));
