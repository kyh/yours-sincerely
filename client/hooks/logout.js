import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';

export const LOGOUT = gql`
  mutation Logout {
    logout {
      message
    }
  }
`;

export function useLogout() {
  return useMutation(LOGOUT);
}
