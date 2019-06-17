import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { Mutation } from 'react-apollo';

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      id
      username
      email
    }
  }
`;

function Login({ children, ...rest }) {
  return (
    <Mutation mutation={LOGIN} {...rest}>
      {(result, params) => children(result, params)}
    </Mutation>
  );
}

Login.propTypes = {
  children: PropTypes.func.isRequired,
};

export default Login;
export { LOGIN };
