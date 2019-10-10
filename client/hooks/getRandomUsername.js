import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

export const GET_RANDOM_USERNAME = gql`
  {
    randomUsername
  }
`;

export function useGetRandomUsername() {
  return useQuery(GET_RANDOM_USERNAME);
}
