import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { Mutation } from 'react-apollo';

const CREATE_POST = gql`
  mutation CreatePost($content: String!) {
    createPost(content: $content) {
      id
      content
    }
  }
`;

function CreatePost({ children, ...rest }) {
  return (
    <Mutation mutation={CREATE_POST} {...rest}>
      {(result, params) => children(result, params)}
    </Mutation>
  );
}

CreatePost.propTypes = {
  children: PropTypes.func.isRequired,
};

export default CreatePost;
export { CREATE_POST };
