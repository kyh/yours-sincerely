import React, { useState } from 'react';
import gql from 'graphql-tag';
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

const LoginForm = ({ classes }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  return (
    <Mutation mutation={LOGIN}>
      {(login, { data, loading, error }) => (
        <form
          className={classes.form}
          onSubmit={(e) => {
            e.preventDefault();
            login({ variables: { username, password } });
          }}
        >
          <TextField
            label="Username"
            value={username}
            className={classes.field}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            className={classes.field}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
      )}
    </Mutation>
  );
};

export default withStyles(styles)(LoginForm);
