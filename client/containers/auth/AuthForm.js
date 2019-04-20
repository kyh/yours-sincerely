import React, { PureComponent } from 'react';
import gql from 'graphql-tag';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { withStyles } from '@material-ui/core/styles';
import { Mutation, withApollo } from 'react-apollo';

import { TextField, Button, Snackbar } from '@components';
import redirect from '@client/utils/redirect';

const styles = (theme) => ({
  form: {},
  field: {
    marginBottom: theme.spacing.unit * 2,
  },
  footer: {},
});

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      id
      username
      email
      name
    }
  }
`;

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('That doesn’t seem right')
    .required('That doesn’t seem right'),
  password: Yup.string()
    .min(6, 'Just a little longer')
    .required('That doesn’t seem right'),
});

class AuthForm extends PureComponent {
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

  render() {
    const { classes } = this.props;
    return (
      <Mutation
        mutation={LOGIN}
        onError={this.onSubmitError}
        onCompleted={this.onSubmitSuccess}
      >
        {(login, { loading, error }) => (
          <Formik
            initialValues={{
              email: '',
              password: '',
            }}
            validationSchema={validationSchema}
            onSubmit={(values) => {
              login({ variables: values });
            }}
          >
            <Form>
              <Snackbar
                isOpen={this.state.isErrorState}
                variant="error"
                message={error && error.graphQLErrors[0].message}
                onClose={this.closeErrorState}
              />
              <TextField label="Email" name="email" className={classes.field} />
              <TextField
                label="Password"
                name="password"
                type="password"
                className={classes.field}
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
            </Form>
          </Formik>
        )}
      </Mutation>
    );
  }
}

export default withStyles(styles)(withApollo(AuthForm));
