import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

export const POSTS_AGGREGATE_QUERY = gql`
  query POSTS_AGGREGATE_QUERY {
    posts_aggregate {
      aggregate {
        count
      }
    }
  }
`;

export function useGetPostsAggregate() {
  return useQuery(POSTS_AGGREGATE_QUERY);
}
