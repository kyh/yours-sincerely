import React, { PureComponent } from 'react';
import gql from 'graphql-tag';
import { Formik } from 'formik';
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

  renderFormField = (id, label, value, formikProps) => {
    const { classes } = this.props;
    const { errors, touched, handleChange, setFieldTouched } = formikProps;
    return (
      <TextField
        id={id}
        name={id}
        label={label}
        className={classes.field}
        helperText={touched[id] ? errors[id] : ''}
        error={touched[id] && Boolean(errors[id])}
        value={value}
        onChange={(e) => {
          e.persist();
          handleChange(e);
        }}
        onBlur={() => setFieldTouched(id, true, false)}
      />
    );
  };

  renderForm = (login, { loading, error }) => {
    const { classes } = this.props;
    return (
      <Formik
        initialValues={{
          email: '',
          password: '',
        }}
        validationSchema={validationSchema}
        onSubmit={(values) => login({ variables: values })}
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
              {this.renderFormField(
                'email',
                'Email',
                formikProps.values.email,
                formikProps,
              )}
              {this.renderFormField(
                'password',
                'Password',
                formikProps.values.password,
                formikProps,
              )}
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
        )}
      />
    );
  };

  render() {
    return (
      <Mutation
        mutation={LOGIN}
        onError={this.onSubmitError}
        onCompleted={this.onSubmitSuccess}
      >
        {this.renderForm}
      </Mutation>
    );
  }
}

export default withStyles(styles)(withApollo(AuthForm));
