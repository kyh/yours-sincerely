import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      id
      username
      email
    }
  }
`;

export function useLogin() {
  return useMutation(LOGIN);
}
