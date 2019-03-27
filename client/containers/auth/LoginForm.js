import React, { useState } from 'react';
import gql from 'graphql-tag';
import { withStyles } from '@material-ui/core/styles';
import { Mutation } from 'react-apollo';
import { TextField, Button } from '@components';

const styles = {};

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

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <Mutation mutation={LOGIN}>
      {(login) => (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            login({ variables: { email, password } });
          }}
        >
          <TextField
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            variant="outlined"
            fullWidth
          />
          <TextField
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            variant="outlined"
            fullWidth
          />
          <Button type="submit">Login</Button>
        </form>
      )}
    </Mutation>
  );
};

export default withStyles(styles)(LoginForm);
