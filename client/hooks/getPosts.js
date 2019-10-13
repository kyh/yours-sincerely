import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

export const GET_POSTS = gql`
  query GET_POSTS {
    posts {
      id
      content
    }
  }
`;

export function useGetPosts() {
  return useQuery(GET_POSTS);
}
