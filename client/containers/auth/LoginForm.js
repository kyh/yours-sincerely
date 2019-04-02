import React from 'react';
import gql from 'graphql-tag';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { withStyles } from '@material-ui/core/styles';
import { Mutation } from 'react-apollo';
import { TextField, Button } from '@components';

const styles = (theme) => ({
  form: {},
  field: {
    marginBottom: theme.spacing.unit * 2,
  },
  footer: {},
});

const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user {
        id
        username
        name
      }
    }
  }
`;

const validationSchema = Yup.object().shape({
  username: Yup.string()
    .min(2, 'Username too short')
    .max(50, 'Username too long!')
    .required('Required'),
  password: Yup.string()
    .min(6, 'Password too short!')
    .required('Required'),
});

const LoginForm = ({ classes }) => {
  return (
    <Mutation mutation={LOGIN}>
      {(login, { data, loading, error }) => (
        <Formik
          initialValues={{
            username: '',
            password: '',
          }}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            login({ variables: values });
          }}
        >
          <Form>
            <TextField
              label="Username"
              name="username"
              className={classes.field}
            />
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
