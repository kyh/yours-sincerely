import React, { useState } from 'react';
import gql from 'graphql-tag';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { withStyles } from '@material-ui/core/styles';
import { Mutation } from 'react-apollo';
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
      token
      user {
        id
        email
        name
      }
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

const LoginForm = ({ classes }) => {
  const [isErrorState, setErrorState] = useState(false);
  return (
    <Mutation
      mutation={LOGIN}
      onError={() => setErrorState(true)}
      onCompleted={() => redirect({}, '/')}
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
              isOpen={isErrorState}
              variant="error"
              message={error && error.graphQLErrors[0].message}
              onClose={() => setErrorState(false)}
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
};

export default withStyles(styles)(LoginForm);
