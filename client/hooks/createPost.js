import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';

export const CREATE_POST = gql`
  mutation CreatePost($content: String!) {
    createPost(content: $content) {
      id
      content
    }
  }
`;

export function useCreatePost() {
  return useMutation(CREATE_POST);
}
