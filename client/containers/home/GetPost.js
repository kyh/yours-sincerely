import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';

const GET_POST = gql`
  query Post($id: ID!) {
    post(where: { id: $id }) {
      id
      content
    }
  }
`;

const GetPost = ({ postId, children, ...rest }) => (
  <Query query={GET_POST} variables={{ id: postId }} {...rest}>
    {(result, params) => children(result, params)}
  </Query>
);

GetPost.propTypes = {
  postId: PropTypes.number.isRequired,
  children: PropTypes.func.isRequired,
};

export default GetPost;
export { GET_POST };
