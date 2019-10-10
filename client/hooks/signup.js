import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';

export const SIGNUP = gql`
  mutation Signup($username: String!, $email: String, $password: String!) {
    signup(username: $username, email: $email, password: $password) {
      id
      username
      email
    }
  }
`;

export function useSignup() {
  return useMutation(SIGNUP);
}
