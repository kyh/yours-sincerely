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
    marginBottom: theme.spacing.unit * 2,
  },
  passwordContainer: {
    '@media (min-width: 700px)': {
      display: 'flex',
      marginBottom: theme.spacing.unit * 2,
    },
  },
  passwordField: {
    marginBottom: theme.spacing.unit * 2,
    '@media (min-width: 700px)': {
      marginBottom: 0,
      marginRight: theme.spacing.unit,
      '&:last-child': {
        marginRight: 0,
      },
    },
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
  username: Yup.string().required('Required'),
  email: Yup.string()
    .email('That doesn’t seem right')
    .required('Your email is required'),
  password: Yup.string()
    .min(6, 'Just a little longer')
    .required('Your password is required'),
  passwordConfirm: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Required'),
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
          passwordConfirm: '',
        }}
        validationSchema={validationSchema}
        onSubmit={(values) => signup({ variables: values })}
        render={(formikProps) => (
          <>
            <Snackbar
              isOpen={this.state.isErrorState}
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
                label="Handle"
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
              <section className={classes.passwordContainer}>
                <FormField
                  id="password"
                  className={classes.passwordField}
                  label="Password"
                  value={formikProps.values.password}
                  formikProps={formikProps}
                  type="password"
                />
                <FormField
                  id="passwordConfirm"
                  className={classes.passwordField}
                  label="Confirm"
                  value={formikProps.values.passwordConfirm}
                  formikProps={formikProps}
                  type="password"
                />
              </section>
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
