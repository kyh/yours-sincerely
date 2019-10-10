import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';

export const GET_POST = gql`
  query Post($id: ID!) {
    post(where: { id: $id }) {
      id
      description
    }
  }
`;

export function useGetPost() {
  return useMutation(GET_POST);
}
