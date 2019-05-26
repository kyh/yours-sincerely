import React, { PureComponent } from 'react';
import gql from 'graphql-tag';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { withStyles } from '@material-ui/core/styles';
import { Mutation, withApollo } from 'react-apollo';

import { FormField, Button, Snackbar } from '@components';
import redirect from '@client/utils/redirect';

const styles = (theme) => ({
  form: {},
  field: {
    marginBottom: theme.spacing(2),
  },
  footer: {},
});

const SIGNUP = gql`
  mutation Signup($username: String!, $email: String, $password: String!) {
    signup(username: $username, email: $email, password: $password) {
      id
      username
      email
      name
    }
  }
`;

const validationSchema = Yup.object().shape({
  username: Yup.string().required('This will be how people find you'),
  email: Yup.string()
    .email('That doesn’t seem right')
    .required('This is how you log in'),
  password: Yup.string()
    .min(6, 'Just a little longer')
    .required('Your password is required'),
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

  onSubmitSuccess = () => {
    // Force a reload of all the current queries now that the user is
    // logged in
    this.props.client.cache.reset().then(() => {
      redirect({}, '/');
    });
  };

  renderForm = (signup, { loading, error }) => {
    const { classes } = this.props;
    return (
      <Formik
        initialValues={{
          username: '',
          email: '',
          password: '',
        }}
        validationSchema={validationSchema}
        onSubmit={(values) => signup({ variables: values })}
        render={(formikProps) => (
          <>
            <Snackbar
              open={this.state.isErrorState}
              variant="error"
              message={error && error.graphQLErrors[0].message}
              onClose={this.closeErrorState}
            />
            <form
              onSubmit={formikProps.handleSubmit}
              onReset={formikProps.handleReset}
            >
              <FormField
                id="username"
                className={classes.field}
                label="Username"
                value={formikProps.values.username}
                formikProps={formikProps}
              />
              <FormField
                id="email"
                className={classes.field}
                label="Email"
                value={formikProps.values.email}
                formikProps={formikProps}
              />
              <FormField
                id="password"
                className={classes.field}
                label="Password"
                value={formikProps.values.password}
                formikProps={formikProps}
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
        )}
      />
    );
  };

  render() {
    return (
      <Mutation
        mutation={SIGNUP}
        onError={this.onSubmitError}
        onCompleted={this.onSubmitSuccess}
      >
        {this.renderForm}
      </Mutation>
    );
  }
}

export default withStyles(styles)(withApollo(SignupForm));
export { SIGNUP };
