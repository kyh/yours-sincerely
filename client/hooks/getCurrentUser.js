import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

export const GET_CURRENT_USER = gql`
  {
    me {
      id
      email
      username
    }
  }
`;

export function useGetCurrentUser() {
  return useQuery(GET_CURRENT_USER);
}
