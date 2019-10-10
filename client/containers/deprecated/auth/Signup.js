import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { Mutation } from 'react-apollo';

const SIGNUP = gql`
  mutation Signup($username: String!, $email: String, $password: String!) {
    signup(username: $username, email: $email, password: $password) {
      id
      username
      email
    }
  }
`;

function Signup({ children, ...rest }) {
  return (
    <Mutation mutation={SIGNUP} {...rest}>
      {(result, params) => children(result, params)}
    </Mutation>
  );
}

Signup.propTypes = {
  children: PropTypes.func.isRequired,
};

export default Signup;
export { SIGNUP };
